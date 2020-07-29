import { Layout, Page, EmptyState } from '@shopify/polaris';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';


const stripePromise = loadStripe('pk_live_0IcVwoptmNzxJFSsBHnhTVH8');

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

async function getStripeSessionId() {
    const response = await fetch('/api/payment/get-session-id');
    return response.json()
}

const Payment = () => {
    const handleClick = async (event) => {
        // Call your backend to create the Checkout session.
        const { sessionId } = await getStripeSessionId()
        
        // When the customer clicks on the button, redirect them to Checkout.
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
            sessionId,
        });
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `error.message`.
    };

    return (
        <Elements stripe={stripePromise}>
            <CardElement
            options={{
                style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                    color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#9e2146',
                },
                },
            }}
            />
        </Elements>
    );
}

/*
<Page>
<Layout>
    <p>
        Display details of payment

        check if customer has card on file, if so just present confirmation to capture payment
        otherwise show stripe reedirect button

        setup session success webhook
        on vaulting success, record stripe customer id, tag customer as having vaulted card for later ease


    </p>
    <button role="link" onClick={handleClick}>
        Checkout
    </button>                
</Layout>
</Page>
*/

export default Payment;