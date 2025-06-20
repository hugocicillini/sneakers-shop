import express from 'express';
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateItemQuantity,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/:cartItemId').patch(updateItemQuantity).delete(removeFromCart);

export default router;
