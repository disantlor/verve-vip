require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('koa-router')
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY } = process.env;
app.prepare().then(() => {

    const server = new Koa();
    server.use(session({ secure: true, sameSite: 'none' }, server));
    server.keys = [SHOPIFY_API_SECRET_KEY];

    server.use(
        createShopifyAuth({
          apiKey: SHOPIFY_API_KEY,
          secret: SHOPIFY_API_SECRET_KEY,
          scopes: [
              'read_products',
              'read_draft_orders',
              'write_draft_orders',
              'read_fulfillments',
              'write_fulfillments',
              'read_orders',
              'write_orders'
            ],
          afterAuth(ctx) {
            const { shop, accessToken } = ctx.session;
            ctx.redirect('/');
          },
        }),
      );

    // FIXME: apply only to UI pages / API
    server.use(verifyRequest());

    server.use(bodyParser());

    const router = new Router();
    require('./routes/api')({ router })
    require('./routes/webhooks')({ router })
    server.use(router.routes())

    server.use(async (ctx) => {
      await handle(ctx.req, ctx.res);
      ctx.respond = false;
      ctx.res.statusCode = 200;
      return
    });

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
    
});


