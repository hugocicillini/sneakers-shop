import express from 'express';
import {
  createCoupon,
  deleteCoupon,
  getCouponByCode,
  getCoupons,
  redeemCoupon,
  updateCoupon,
  validateCoupon,
} from '../controllers/couponController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.get('/code/:code', getCouponByCode); // Para verificação de cupom sem login

// Rotas que requerem apenas autenticação (qualquer usuário)
router.post('/code/:code/validate', validateCoupon);
router.post('/code/:code/redeem', redeemCoupon);

// Rotas administrativas (requerem autenticação como admin)
router.get('/', authMiddleware, getCoupons); // Lista todos (admin)
router.post('/', authMiddleware, createCoupon);
router.put('/:couponId', authMiddleware, updateCoupon);
router.delete('/:couponId', authMiddleware, deleteCoupon);

export default router;
