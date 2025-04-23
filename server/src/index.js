import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

import { swaggerDocs, swaggerUi } from './config/swagger.js';

import cartRoute from './routes/cartRoute.js';
import favoriteRoute from './routes/favoriteRoute.js';
import sneakersRoute from './routes/sneakersRoute.js';
import usersRoute from './routes/usersRoute.js';
import addressesRoute from './routes/addressesRoute.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (req, res) => {
  return res.status(200).send('Server running!');
});

app.use('/sneakers', sneakersRoute);
app.use('/users', usersRoute);
app.use('/cart', cartRoute);
app.use('/favorites', favoriteRoute);
app.use('/addresses', addressesRoute);

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
