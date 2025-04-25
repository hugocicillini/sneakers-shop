import express from 'express';
import {
  addToCart,
  getCart,
  removeFromCart,
  updateItemQuantity,
  clearCart,
  syncCart
} from '../controllers/cartController.js';
import { authMiddleware, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rotas de carrinho
router.post('/item', addToCart);
router.post('/', addToCart);  // Mantendo compatibilidade com sua implementação atual
router.get('/', getCart);
router.patch('/item/:cartItemId', updateItemQuantity);
router.delete('/item/:cartItemId', removeFromCart);
router.delete('/', clearCart);
router.post('/sync', syncCart);

export default router;
