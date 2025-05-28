import express from 'express';
import { 
  processCardPayment, 
  getPaymentInfo, 
  handlePaymentWebhook, 
  createPreference 
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota para processar pagamento com cartão de crédito (requer autenticação)
router.post('/card', authMiddleware, processCardPayment);

// Rota para obter informações sobre um pagamento específico (requer autenticação)
router.get('/:paymentId', authMiddleware, getPaymentInfo);

// Rota para receber webhooks do Mercado Pago (não requer autenticação)
router.post('/webhook', handlePaymentWebhook);

// Rota para criar preference do MercadoPago (Checkout Bricks)
router.post('/preference', authMiddleware, createPreference);

export default router;
