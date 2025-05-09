import express from 'express';
import {
  addToCart,
  applyCoupon, // Adicionar importação
  clearCart,
  getCart,
  removeFromCart,
  syncCart,
  updateItemQuantity,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Rotas de carrinho
router.post('/item', addToCart);
router.post('/', addToCart); // Alternativa para compatibilidade
router.get('/', getCart);
router.patch('/item/:cartItemId', updateItemQuantity);
router.patch('/:cartItemId', updateItemQuantity); // Alternativa para compatibilidade
router.delete('/item/:cartItemId', removeFromCart);
router.delete('/:cartItemId', removeFromCart); // Alternativa para compatibilidade
router.delete('/', clearCart);
router.post('/sync', syncCart);
router.post('/coupon', applyCoupon); // Nova rota para aplicação de cupom

export default router;
