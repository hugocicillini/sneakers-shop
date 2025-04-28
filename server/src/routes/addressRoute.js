import express from 'express';
import {
  createAddress,
  deleteAddress,
  getUserAddresses,
  updateAddress,
} from '../controllers/addressController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas de endereço
router.get('/', authMiddleware, getUserAddresses);
router.post('/', authMiddleware, createAddress);
router.put('/:id', authMiddleware, updateAddress);
router.delete('/:id', authMiddleware, deleteAddress);

export default router;
