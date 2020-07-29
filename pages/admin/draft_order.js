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

const DraftOrder = ({ error, draft_order, customer }) => {
  
    function back() {
      console.log(`https://vervewine.com/admin/draft_orders/${draft_order.id}`)
      location.href = `https://vervewine.com/admin/draft_orders/${draft_order.id}`
    }

    function chargeCard() {

      fetch(
        `${process.env.BASE_URL}/api/draft_order/${draft_order.id}/complete`,
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

    function sendInvoice() {

    }

    if (error) {
      return (
        <div>{error}</div>
      );
    }

    const invoice_url = `${process.env.BASE_URL}/order/${draft_order.id}/pay`

    const rows = draft_order.line_items.map(line => [
      line.title + ' - ' + line.variant_title,
      line.quantity,
      line.price
    ])
  
    return (
      <Page fullWidth="true">
        <Layout.Section>
          <TextContainer>
            <Heading>Draft Order {draft_order.name}</Heading>
            <Subheading>Customer: {draft_order.customer.first_name} {draft_order.customer.last_name}</Subheading>
            { customer && 
              <Badge>Stripe ID: {customer.id}</Badge>
            }
            {! customer &&
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
  
        {customer && customer.default_source && 
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: `Charge Card $${draft_order.total_price}`,
                onAction: chargeCard
              }}
              secondaryActions={[
                {
                  content: 'Back'
                },
              ]}
            />
          </Layout.Section>
        }

        {(! customer || (customer && ! customer.default_source)) && 
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: `Send invoice`,
                onAction: sendInvoice
              }}
              secondaryActions={[
                {
                  content: 'Preview Invoice',
                  onAction: function() {
                    window.open(invoice_url)
                  }
                },
              ]}
            />
          </Layout.Section>        
        }

      </Page>
    )
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