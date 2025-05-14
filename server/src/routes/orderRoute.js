import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas as rotas de pedidos exigem autenticação
router.use(authMiddleware);

// Rota para criar um novo pedido e listar todos os pedidos do usuário
router.route('/').post(createOrder).get(getOrders);

// Rota para obter, atualizar ou cancelar um pedido específico
router.route('/:id').get(getOrderById).patch(updateOrder);

export default router;
