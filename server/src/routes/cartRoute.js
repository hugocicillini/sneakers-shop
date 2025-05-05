import express from 'express';
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  syncCart,
  updateItemQuantity,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rotas de carrinho
router.post('/item', addToCart);
router.post('/', addToCart); // Mantendo compatibilidade com sua implementação atual
router.get('/', getCart);
router.patch('/item/:cartItemId', updateItemQuantity);
router.patch('/:cartItemId', updateItemQuantity); // Nova rota para compatibilidade com o client
router.delete('/item/:cartItemId', removeFromCart);
router.delete('/:cartItemId', removeFromCart); // Nova rota para compatibilidade com o client
router.delete('/', clearCart);
router.post('/sync', syncCart);

export default router;
