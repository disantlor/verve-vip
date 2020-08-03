const dotenv = require('dotenv');
dotenv.config();
const Stripe = require('stripe')(process.env.STRIPE_API_SECRET);

Stripe.webhookEndpoints.del("we_1HAh1OC450bQDMuZWSANEj5q")
.then(() =>{

Stripe.webhookEndpoints
    .list({limit:3})
    .then(result => {
        console.log(result)
    })
})
    /*
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
*/