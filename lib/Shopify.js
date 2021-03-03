const Shopify = require('shopify-api-node');
const shopify = new Shopify({
    shopName: process.env.SHOPIFY_STORE_URL,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_API_SECRET_KEY,
    autoLimit: true,
    apiVersion: '2020-01'
});

module.exports = shopify;