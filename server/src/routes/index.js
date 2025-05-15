import addressRoute from './addressRoute.js';
import cartRoute from './cartRoute.js';
// import paymentRoute from './paymentRoute.js';
import couponRoute from './couponRoute.js';
import orderRoute from './orderRoute.js';
import reviewRoute from './reviewRoute.js';
import sneakerRoute from './sneakerRoute.js';
import userRoute from './userRoute.js';
import wishlistRoute from './wishlistRoute.js';

const routes = (app) => {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';

  app.use(`${apiPrefix}/sneakers`, sneakerRoute);
  app.use(`${apiPrefix}/users`, userRoute);
  app.use(`${apiPrefix}/carts`, cartRoute);
  app.use(`${apiPrefix}/wishlists`, wishlistRoute);
  app.use(`${apiPrefix}/addresses`, addressRoute);
  app.use(`${apiPrefix}/reviews`, reviewRoute);
  // app.use(`${apiPrefix}/payments`, paymentRoute);
  app.use(`${apiPrefix}/orders`, orderRoute);
  app.use(`${apiPrefix}/coupons`, couponRoute);
};

export default routes;
