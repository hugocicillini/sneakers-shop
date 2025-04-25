import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

import { swaggerDocs, swaggerUi } from './config/swagger.js';

import cartRoute from './routes/cartRoute.js';
import sneakerRoute from './routes/sneakerRoute.js';
import userRoute from './routes/userRoute.js';
import wishlistRoute from './routes/wishlistRoute.js';
import addressRoute from './routes/addressRoute.js';
import reviewRoute from './routes/reviewRoute.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (req, res) => {
  return res.status(200).send('Server running!');
});

app.use('/api/sneakers', sneakerRoute);
app.use('/api/users', userRoute);
app.use('/api/carts', cartRoute);
app.use('/api/wishlists', wishlistRoute);
app.use('/api/addresses', addressRoute);
app.use('/api/reviews', reviewRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conected to: MongoDB!🍃');
    app.listen(process.env.PORT, () => {
      // console.log(`Server started at: https://sneakers-shop-tm46.onrender.com 🚀`);
      console.log(`Server started at: http://localhost:${process.env.PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
