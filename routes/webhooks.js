const R = require('ramda')
const moment = require('moment')
const VIP = require('../lib/VIP')
const Shopify = require('../lib/Shopify')


// TODO:
// WEBHOOK APPROACH DEPRECATED IN FAVOR OF 2-step "add card" then "complete payment" flow
// Code left here for reference

module.exports = ({ router }) => {

    router.get(
        '/webhooks/stripe',
        async (context) => {

            context.body  = "TEST"
        }
    )

    // FIXME: use separate API key for this app... instantiate Shopify via lib with autoLimit true
    // investigate global error logging approach with email triggers

    router.post(
        '/webhooks/stripe',
        async (context) => {

            let event = context.request.body

            // Handle the event
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    const { client_reference_id } = session;
                    // don't try/catch... we want it to fail so the webhook fails
                    let completed_order = await VIP.completeDraftOrder(client_reference_id);
                    break;
                default:
                    break;
            }

            // Return a response to acknowledge receipt of the event
            context.body = "ok";
        }
    );
}