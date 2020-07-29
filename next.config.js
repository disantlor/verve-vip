require("dotenv").config();
const withCSS = require('@zeit/next-css');
const webpack = require('webpack');

const apiKey =  JSON.stringify(process.env.SHOPIFY_API_KEY);

module.exports = withCSS({
  webpack: (config, { dev }) => {
    const env = { API_KEY: apiKey };
    config.plugins.push(new webpack.DefinePlugin(env));
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }    
    return config;
  }
});