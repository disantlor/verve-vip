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
import React from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_API_KEY);

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

async function getStripeSessionId(draft_order_id) {
    try {
        let response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/draft_order/${draft_order_id}/setup-payment`);
        return response.json()
    } catch (e) {
        console.error(e);
        alert("Something went wrong")
    }
}

class Payment extends React.Component {

    constructor(props) {
        super()

        let { error, draft_order, customer } = props;

        this.state = {
            error,
            draft_order,
            customer
        }

        this.redirectToStripe = this.redirectToStripe.bind(this);
        this.chargeCard = this.chargeCard.bind(this);
    }

    async redirectToStripe() {
        this.setState({ loading: true })

        const { draft_order } = this.props;
        const { sessionId } = await getStripeSessionId(draft_order.id)
        if (!sessionId) {
            alert("Something went wrong")
            return false;
        }
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
            sessionId,
        });
    }

    chargeCard() {
        this.setState({ loading: true })
        
        const { draft_order } = this.props;
        fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/draft_order/${draft_order.id}/complete`,
            {
                method: 'POST'
            }
        )
            .then(response => {
                if (response.status === 200) {
                    alert("Success!")
                } else {
                    alert("Error completing payment. Charge likely denied by bank. Please contact privateclient@vervewine.com for help.")
                }
                window.location.reload()
                //console.log("SUCCESS", "redirecting to order...", response.order.id)
            })
            .catch(error => {
                console.error("Error completeing draft order", error)
            })

    }

    render() {
        let { error, draft_order, customer, loading } = this.state;

        if (error) {
            return (
                <Page>
                    <Layout>
                        <Layout.Section>
                            <TextContainer>{error}</TextContainer>
                        </Layout.Section>
                    </Layout>
                </Page>
            )
        }

        const rows = draft_order.line_items.map(line => [
            line.title + ' - ' + line.variant_title,
            line.quantity,
            line.price
        ])

        if (draft_order.shipping_line) {
            rows.push([
                `Shipping: ${draft_order.shipping_line.title}`,
                '',
                draft_order.shipping_line.price
            ])
        }

        if (draft_order.applied_discount) {
            rows.push([
                `Discounts:`,
                '',
                draft_order.applied_discount.amount
            ])
        }

        let has_payment_method = customer && customer.has_payment_method 

        return (
            <Page>
                <Layout>
                    <Layout.Section>
                        <TextContainer>
                            <Heading>Verve Wine Invoice {draft_order.name}</Heading>
                        </TextContainer>
                    </Layout.Section>

                    <Layout.Section>
                        <p>Customer: {draft_order.customer.first_name} {draft_order.customer.last_name}</p>
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
                                showTotalsInFooter='true'
                                totals={['', '', draft_order.total_price]}
                            />
                        </Card>
                    </Layout.Section>

                    {draft_order.status === 'completed' &&
                        <Layout.Section>
                            <TextContainer>
                                 <p>Paid, thank you!<br/><a href="https://www.vervewine.com">Continue shopping on Verve Wine</a></p>
                            </TextContainer>
                        </Layout.Section>        
                    }

                    {draft_order.status !== 'completed' &&
                        <Layout.Section>
                            
                            { ! has_payment_method && 
                                <TextContainer>
                                    <p style={{ textAlign: "right", paddingBottom: "20px" }}>To complete your order, add a payment method via the button below. We will save your card on file for future orders.</p>
                                </TextContainer>
                            }

                            { has_payment_method && 
                                <TextContainer>
                                    <p style={{ textAlign: "right", paddingBottom: "20px" }}>We will charge your card on file. To change payment methods email us at <a href="mailto:privateclient@vervewine.com">privateclient@vervewine.com</a>.</p>
                                </TextContainer>
                            }
                            
                            <PageActions
                                primaryAction={{
                                    content: has_payment_method
                                        ? `Submit Order`
                                        : `Add Payment Method`,
                                    loading: loading === true,
                                    onAction: has_payment_method
                                        ? this.chargeCard
                                        : this.redirectToStripe
                                }}
                            />
                        </Layout.Section>
                    }

                </Layout>
            </Page>
        );
    }

}


export async function getServerSideProps(context) {
    const draft_order_id = context.params.order_id

    let data = {}
    try {
        let res = await fetch(`${process.env.BASE_URL}/api/draft_order/${draft_order_id}`)
        data = await res.json()
    } catch (e) {
        console.error("Error fetching draft order information", e.message)
    }

    return { props: data }
}

export default Payment;