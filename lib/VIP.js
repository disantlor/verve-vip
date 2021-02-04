const R = require('ramda')
const Stripe = require('stripe')(process.env.STRIPE_API_SECRET)
const Shopify = require('./Shopify')


async function getStripeCustomerForDraftOrder(draft_order_id) {

    if (! draft_order_id) {
        throw 'Cannot proceed without draft order id'
    }        

    // Get the Draft Order from Shopify
    let draft_order = false;
    try {
        draft_order = await Shopify.draftOrder.get(draft_order_id);
    } catch(e) {
        console.error('Error fetching draft order', e.message)
        throw 'Could not find Draft Order'
    }

    // Pull the customer email, if empty then no customer attached to Draft Order... exit
    let shopify_customer = R.propOr({}, 'customer')(draft_order);
    let customer_email = R.prop('email')(shopify_customer)
    if (! customer_email) {
        throw 'No customer attached to this order. Can not continue.'
    }

    // Look for a customer id among the customer tags
    let stripe_customer_id = R.pipe(
        R.propOr('', 'tags'),
        R.split(','),
        R.map(R.trim),
        R.filter(R.startsWith('cus_')),
        (stripe_customer_id_tags) => {
            if (R.length(stripe_customer_id_tags) > 1) {
                throw 'Multiple Stripe customer id tags found. Something is wrong.'
            }
            return stripe_customer_id_tags
        },
        R.head
    )(shopify_customer)

    let stripe_customer = false;
    // If tags contained a customer id, pull up the relevant customer in Stripe
    // If this fails for some reason then something has gotten out of sync
    if (stripe_customer_id) {
        try {
            stripe_customer = await Stripe.customers.retrieve(stripe_customer_id);
        } catch(e) {
            console.error('Error fetching customer from Stripe', e.message)
            throw 'Something went wrong fetching Stripe customer info';
        }
    }

    // expose only a specific subset of customer data
    let customer = false;
    if (stripe_customer && ! stripe_customer.deleted) {
        let payment_methods = await Stripe.paymentMethods.list({ customer: stripe_customer.id, type: 'card' })
        customer = {
            id: stripe_customer.id,
            has_payment_method: R.pipe(
                R.propOr([], 'data'),
                R.isEmpty,
                R.not
            )(payment_methods) 
        }
    }

    return {
        draft_order,
        customer
    }

}

async function completeDraftOrder(draft_order_id) {

    let { draft_order, customer } = await getStripeCustomerForDraftOrder(draft_order_id)

    if (! draft_order) {
        throw "Draft order not found."
    }

    if (draft_order.status === 'completed') {
        console.log(`Draft order ${draft_order.id} already complete. Nothing to do`)
        return false;
    }

    if (! customer) {
        throw "No Stripe customer record found for attached customer."
    }

    if (! customer.has_payment_method) {
        throw "Customer has no card on file. Cannot continue."
    }

    let payment_methods = await Stripe.paymentMethods.list({ customer: customer.id, type: 'card' })

    let charge_params = {
        confirm: false,
        amount: R.pipe(
            R.prop('total_price'),
            parseFloat,
            R.multiply(100),
            Math.floor
        )(draft_order),
        currency: 'USD',
        customer: customer.id,
        payment_method: R.pathOr(false, ['data', 0, 'id'])(payment_methods)
    }

    console.log("About to charge card and complete order", charge_params)

    let charge = false;
    // Charge the card using the default payment source for the customer 
    // Per Sripe docs, "default source" is used when only customer (and not "source") param is set
    try {
        charge = await Stripe.paymentIntents.create(charge_params, { maxNetworkRetries: 2 })
        console.log("Successfully charged card", charge)
    } catch(e) {
        console.error('Failed to charge customer card', charge_params, e)
        // TODO: record failure somehwere
        throw "Failed to capture payment."
    }

    let charge_id = R.propOr(false, 'id')(charge)

    if (! charge_id) {
        console.error("Missing charge id")
        throw "Something went wrong capturing payment"
    }

    // Now that charge is successful, complete the draft order in Shopify and turn it into a real order
    let completed_order = false;
    try {
        completed_order = await Shopify.draftOrder.complete(draft_order_id);
    } catch (e) {
        try {
            let cancelled_payment = await Stripe.paymentIntents.cancel(charge_id)
            console.log("Cancelled payment intent:", cancelled_payment)
        } catch(e) {
            console.error("Could not cancel payment!")
        }
        console.error('Failed to complete order:', e)
        throw 'Failed to complete order.'
    }

    console.log("Completed order:", completed_order.order_id)

    // confirm payment now that order is created
    try {
        console.log("About to complete payment", charge_id)
        await Stripe.paymentIntents.confirm(charge_id, { maxNetworkRetries: 2 })
    } catch(e) {
        console.error("Could not complete payment", charge)
        await Shopify.order.update(
            completed_order.order_id, // this is the ID of the actual order created from the draft order
            {
                tags: R.pipe(
                    R.propOr('', 'tags'),
                    R.split(','),
                    R.map(R.trim),
                    R.append("Attention Needed: Stripe Payment Issue"),
                    R.uniq,
                    R.join(', ')
                )(completed_order)
            }
        )

        throw "Could not complete payment!"
    }

    // Now, tag newly created order with payment intent id so it can be tracked back for CX purposes
    await Shopify.order.update(
        completed_order.order_id, // this is the ID of the actual order created from the draft order
        {
            tags: R.pipe(
                R.propOr('', 'tags'),
                R.split(','),
                R.map(R.trim),
                R.append(charge.id),
                R.append("Verve VIP"),
                R.uniq,
                R.join(', ')
            )(completed_order)
        }
    )

    return completed_order;
}

module.exports = {
    getStripeCustomerForDraftOrder,
    completeDraftOrder
}