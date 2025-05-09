import express from 'express';
import {
  checkPaymentStatus,
  generateBankSlip,
  generatePixPayment,
  initializePayment,
  processCreditCardPayment,
  webhookHandler
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas protegidas (requerem autenticação)
router.post('/initialize', authMiddleware, initializePayment);
router.post('/credit-card', authMiddleware, processCreditCardPayment);
router.post('/pix', authMiddleware, generatePixPayment);
router.post('/bank-slip', authMiddleware, generateBankSlip);
router.get('/status/:paymentId', authMiddleware, checkPaymentStatus);

// Webhook (rota pública)
router.post('/webhook', webhookHandler);

export default router;
