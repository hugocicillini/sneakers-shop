import express from 'express';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createOrder);

router.get('/user', getUserOrders);

router.get('/:orderId', getOrderById);

router.patch('/:orderId/status', updateOrderStatus);

export default router;
