import express from 'express';
import {
  addToWishlist,
  clearWishlist,
  getUserWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getUserWishlist);
router.post('/', authMiddleware, addToWishlist);
router.delete('/:sneakerId', authMiddleware, removeFromWishlist);
router.delete('/', authMiddleware, clearWishlist);

export default router;
