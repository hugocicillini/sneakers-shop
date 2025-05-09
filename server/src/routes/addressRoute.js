import express from 'express';
import {
  createAddress,
  deleteAddress,
  getUserAddresses,
  updateAddress,
} from '../controllers/addressController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rotas de endereço
router.route('/').get(getUserAddresses).post(createAddress);

router.route('/:addressId').put(updateAddress).delete(deleteAddress);

export default router;
