const dotenv = require('dotenv');
dotenv.config();
const Stripe = require('stripe')(process.env.STRIPE_API_SECRET);

Stripe.webhookEndpoints
    .create({
        url: 'https://verve-vip.herokuapp.com/webhooks/stripe',
        enabled_events: [
            'checkout.session.completed'
        ],
    })
    .then(result => {
        console.log(result)
    })
    