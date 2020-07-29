import { Layout, Page, EmptyState } from '@shopify/polaris';

const Index = () => (
    <Page>
        <Layout>
            <EmptyState
                heading="Capture payment for Draft Orders via Stripe"
            >
                <p>Go to the Draft Orders, open a pending order, and select "Complete Payment via Stripe" from the "More Actions" dropdown</p>
            </EmptyState>
        </Layout>
    </Page>
);

export default Index;