import express from 'express';
import {
  createAddress,
  deleteAddress,
  getUserAddresses,
  getUserDefaultAddress,
  updateAddress,
} from '../controllers/addressController.js';

const router = express.Router();

// Rotas de endereço
router.get('/:userId', getUserAddresses);
router.get('/:userId/default', getUserDefaultAddress);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
