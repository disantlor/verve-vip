const dotenv = require('dotenv');
dotenv.config();
const Stripe = require('stripe')(process.env.STRIPE_API_SECRET);

Stripe.customers.retrieve(
    'cus_HkZbixQqvM2Fyb',
    function(err, customer) {
        console.log(customer)
      // asynchronously called
    }
  );
Stripe.paymentMethods.list(
    { customer: 'cus_HkZbixQqvM2Fyb', type: 'card' },
    function (err, paymentMethods) {
        console.log(paymentMethods)
        // asynchronously called
    }
);