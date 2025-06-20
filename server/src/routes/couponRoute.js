import express from 'express';
import { validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

router.post('/code/:code/validate', validateCoupon);

export default router;
