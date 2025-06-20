import express from 'express';
import {
  createSneaker,
  deleteSneaker,
  getSneakerBySlug,
  getSneakers,
  getSneakerVariants,
  updateSneaker,
  updateVariantStock,
} from '../controllers/sneakerController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getSneakers);
router.get('/:slug', getSneakerBySlug);
router.get('/:sneakerId/variants', getSneakerVariants);

router.post('/', authMiddleware, createSneaker);
router.put('/:sneakerId', authMiddleware, updateSneaker);
router.delete('/:sneakerId', authMiddleware, deleteSneaker);
router.put('/variants/:variantId/stock', authMiddleware, updateVariantStock);

export default router;
