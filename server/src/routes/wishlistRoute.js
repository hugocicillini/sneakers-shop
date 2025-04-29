import express from 'express';
import {
  addFavorite,
  getFavorites,
  removeFavorite
} from '../controllers/wishlistController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, addFavorite);

router.get('/', authMiddleware, getFavorites);

router.delete('/:sneakerId', authMiddleware, removeFavorite);

export default router;
