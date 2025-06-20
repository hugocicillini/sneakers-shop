import express from 'express';
import { 
  processPayment, 
  getPaymentInfo, 
  handlePaymentWebhook, 
  createPreference 
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/preference', authMiddleware, createPreference);

router.post('/payment', authMiddleware, processPayment);

router.get('/:paymentId', authMiddleware, getPaymentInfo);

router.post('/webhook', handlePaymentWebhook);


export default router;
