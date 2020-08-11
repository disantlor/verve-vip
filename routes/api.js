const R = require('ramda')
const moment = require('moment')
const VIP = require('../lib/VIP')
const Stripe = require('stripe')(process.env.STRIPE_API_SECRET);
const Shopify = require('../lib/Shopify')

module.exports = ({ router }) => {

    router.get('/api/draft_order/:draft_order_id', async (context) => {
        try {
            context.body = await VIP.getStripeCustomerForDraftOrder(context.params.draft_order_id)
        } catch(e) {
            context.status = 400
            context.body = { error: e.message }
        }
    })

    router.post('/api/draft_order/:draft_order_id/complete', async (context) => {
        let order = await VIP.completeDraftOrder(context.params.draft_order_id)
        context.body = { order } 
    })

    router.post('/api/draft_order/:draft_order_id/send-invoice', async (context) => {
        let draft_order_id = R.path(['params', 'draft_order_id'])(context)
        let { draft_order, customer } = await VIP.getStripeCustomerForDraftOrder(draft_order_id)

        await Shopify.draftOrder.sendInvoice(
            context.params.draft_order_id,
            {
                //from: 'privateclient@vervewine.com',
                custom_message: `${process.env.BASE_URL}/order/${draft_order_id}/pay`
            }
        )

        context.body = { success: true }
    })


    router.get('/api/draft_order/:draft_order_id/setup-payment', async (context) => {
        let { draft_order, customer } = await VIP.getStripeCustomerForDraftOrder(context.params.draft_order_id)

        // if no customer, create one
        if (! customer) {
            try {
                customer = await Stripe.customers.create({
                    email: draft_order.email,
                    name: draft_order.customer.first_name + ' ' + draft_order.customer.last_name,
                    metadata: {
                        shopify_customer_id: draft_order.customer.id
                    }
                })
                console.log("Created new stripe customer", customer)
            } catch (e) {
                console.error('Could not create Stripe customer for draft order:', e.message, draft_order.id)
                throw new Error('Customer creation failed. Cannot complete order without valid customer')
            }
            // update customer record to store strip customer id as tag        
            try {
                let new_tags = R.pipe(
                    R.propOr('', 'tags'),
                    R.split(','),
                    R.map(R.trim),
                    R.append(customer.id),
                    R.uniq,
                    R.join(',')
                )(draft_order.customer)                
                 await Shopify.customer.update(draft_order.customer.id, { tags: new_tags })
            } catch (e) {
                console.error("Failed to record Stripe customer id", draft_order.customer.id, customer.id, e.message)
                throw new Error('Error when recording Stripe customer id')
            }
        }

        // TODO: how to pass error message (like customer might already exist) back to client

        // create Stripe session
        let session_params = {
            payment_method_types: ['card'],
            client_reference_id: draft_order.id,
            customer: customer.id,
            mode: 'setup',
            success_url: `${process.env.BASE_URL}/order/${draft_order.id}/pay?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/order/${draft_order.id}/pay`
        }
        
        let session = false;

        try {
            session = await Stripe.checkout.sessions.create(session_params);
        } catch(e) {
            console.error(e.message, session_params)
            throw new Error('Session could not be created.')
        }

        // record session creation/date on draft order
        try {
            await Shopify.draftOrder.update(
                draft_order.id,
                {
                    tags: R.pipe(
                        R.propOr('', 'tags'),
                        R.split(','),
                        R.map(R.trim),
                        R.append(`Invoice sent via Stripe on ${moment().format('M/D')}`),
                        R.uniq,
                        R.join(', ')
                    )(draft_order)
                }
            )
        } catch(e) {
            console.error("Could not tag Shopify draft order. Invoice still sent but not recorded in Shopify.")
        }

        context.body = { sessionId: session.id };
    });

};