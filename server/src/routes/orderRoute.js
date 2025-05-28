import express from 'express';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas as rotas de pedidos exigem autenticação
router.use(authMiddleware);

// Rota para criar um novo pedido
router.post('/', createOrder);

// Rota para listar pedidos do usuário atual
router.get('/user', getUserOrders);

// Rota para obter um pedido específico
router.get('/:id', getOrderById);

// Rota para atualizar status de um pedido (incluindo cancelamento)
router.patch('/:id/status', updateOrderStatus);

export default router;
