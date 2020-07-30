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

import React from 'react'

//const DraftOrder = ({ error, draft_order, customer }) => {
class DraftOrder extends React.Component {

  constructor(props) {
    super()

    let { error, draft_order, customer } = props;
    
    this.state = {
      error,
      draft_order,
      customer
    }

    this.chargeCard = this.chargeCard.bind(this);
    this.sendInvoice = this.sendInvoice.bind(this);
  }

  back() {
    console.log(`https://vervewine.com/admin/draft_orders/${draft_order.id}`)
    location.href = `https://vervewine.com/admin/draft_orders/${draft_order.id}`
  }

  chargeCard(e) {

    console.log(this, e)

    this.setState({ loading: true })

    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/draft_order/${draft_order.id}/complete`,
      {
        method: 'POST'
      }
    )
      .then(response => response.json())
      .then(response => {
        alert("Success!")
        window.location.reload()
        //console.log("SUCCESS", "redirecting to order...", response.order.id)
      })
      .catch(error => {
        console.error("Error completeing draft order", error)
      })

  }

  sendInvoice() {

    this.setState({ loading: true })

    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/draft_order/${draft_order.id}/send-invoice`,
      {
        method: 'POST'
      }
    )
      .then(response => response.json())
      .then(response => {
        alert("Success!")
        window.location.reload()
        //console.log("SUCCESS", "redirecting to order...", response.order.id)
      })
      .catch(error => {
        console.error("Error completeing draft order", error)
      })

  }

  render(a, b) {
    let { error, draft_order, customer, loading } = this.state

    console.log("loading", loading)
    if (error) {
      return (
        <div>{error}</div>
      );
    }

    const invoice_url = `${process.env.NEXT_PUBLIC_BASE_URL}/order/${draft_order.id}/pay`

    const rows = draft_order.line_items.map(line => [
      line.title + ' - ' + line.variant_title,
      line.quantity,
      line.price
    ])

    let mode = false;

    if (customer && customer.default_source) {
      mode = 'charge'
    }

    if (!customer || (customer && !customer.default_source)) {
      mode = 'invoice'
    }

    if (draft_order.status === 'completed') {
      mode = 'complete'
    }


    return (
      <Page fullWidth="true">
        <Layout.Section>
          <TextContainer>
            <Heading>Draft Order {draft_order.name}</Heading>
            <Subheading>Customer: {draft_order.customer.first_name} {draft_order.customer.last_name}</Subheading>
            {customer &&
              <Badge>Stripe ID: {customer.id}</Badge>
            }
            {!customer &&
              <TextContainer>
                <p>This customer does not currently have a record in Stripe. Sending the invoice will setup the Stripe account for all orders going forward.</p>
              </TextContainer>
            }
          </TextContainer>
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

        {mode === 'charge' &&
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: `Charge Card $${draft_order.total_price}`,
                onAction: this.chargeCard,
                loading: loading === true
              }}
              secondaryActions={[
                {
                  content: 'Back'
                },
              ]}
            />
          </Layout.Section>
        }

        {mode === 'invoice' &&
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: `Send invoice`,
                onAction: this.sendInvoice,
                loading: loading === true
              }}
              secondaryActions={[
                {
                  content: 'Preview Invoice',
                  onAction: function () {
                    window.open(invoice_url)
                  }
                },
              ]}
            />
          </Layout.Section>
        }

        {mode === 'complete' &&
          <Layout.Section>
            <TextContainer>
              <p>This invoice is already paid</p>
            </TextContainer>
          </Layout.Section>
        }

      </Page>
    )
  }
}

export async function getServerSideProps(context) {
  const draft_order_id = context.query.id

  let data = {}
  try {
    let res = await fetch(`${process.env.BASE_URL}/api/draft_order/${draft_order_id}`)
    data = await res.json()
  } catch (e) {
    console.error("Error fetching draft order information", e.message)
  }

  return { props: data }
}

export default DraftOrder