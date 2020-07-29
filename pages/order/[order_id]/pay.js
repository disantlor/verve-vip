import {
    Page,
    Badge,
    Heading,
    Subheading,
    TextContainer,
    Card,
    DataTable,
    Layout,
    PageActions
} from '@shopify/polaris';

import { loadStripe } from '@stripe/stripe-js';


const stripePromise = loadStripe('pk_live_0IcVwoptmNzxJFSsBHnhTVH8');

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

async function getStripeSessionId() {
    const response = await fetch('/api/draft_order/569485852732/setup-payment');
    return response.json()
}

const Payment = ({ error, draft_order, customer }) => {
    const redirectToStripe = async (event) => {
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

    const chargeCard = async (event) => {
        fetch(
            `https://verve-wine-vip.ngrok.io/api/draft_order/${draft_order.id}/complete`,
            {
              method: 'POST'
            }
          )
          .then(response => response.json())
          .then(response => {
            alert("Success!")
            console.log("SUCCESS", "redirecting to order...", response.order.id)
          })
          .catch(error => {
            console.error("Error completeing draft order", error)
          })
    
    }

    const rows = draft_order.line_items.map(line => [
        line.title + ' - ' + line.variant_title,
        line.quantity,
        line.price
    ])

    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <TextContainer>
                        <Heading>Verve Wine</Heading>
                    </TextContainer>
                </Layout.Section>

                <Layout.Section>
                    <p>
                        More content goes here
                    </p>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <DataTable
                            columnContentTypes={[
                                'text',
                                'numeric',
                                'numeric',
                            ]}
                            headings={[
                                'Items in Order',
                                'Quantity',
                                'Price',
                            ]}
                            rows={rows}
                        />
                    </Card>
                </Layout.Section>

                {(! customer || (customer && ! customer.default_source)) && 
                    <Layout.Section>
                        <TextContainer>
                            <p>You will be redirected to Stripe to securely enter and store your credit card information. This card will be used for this and future orders.</p>
                        </TextContainer>
                        <PageActions
                            primaryAction={{
                                content: `Enter Credit Card`,
                                onAction: redirectToStripe
                            }}
                        />
                    </Layout.Section>
                }

                {customer && customer.default_source &&
                    <Layout.Section>
                        <PageActions
                            primaryAction={{
                                content: `Pay`,
                                onAction: chargeCard
                            }}
                        />
                    </Layout.Section>
                }       

            </Layout>
        </Page>
    );
}


export async function getServerSideProps(context) {
    const draft_order_id = context.params.order_id

    let data = {}
    try {
        let res = await fetch(`https://verve-wine-vip.ngrok.io/api/draft_order/${draft_order_id}`)
        data = await res.json()
    } catch (e) {
        console.error("Error fetching draft order information", e.message)
    }

    return { props: data }
}

export default Payment;