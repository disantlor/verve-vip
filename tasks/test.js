const dotenv = require('dotenv');
dotenv.config();
const Stripe = require('stripe')(process.env.STRIPE_API_SECRET);
const VIP = require('../lib/VIP')


VIP.getStripeCustomerForDraftOrder(573957963836).then(console.log).catch(console.error)
