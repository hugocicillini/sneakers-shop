import express from 'express';
import {
  // createSneaker,
  getSneakerBySlug,
  getSneakers,
  updateSneaker,
  deleteSneaker,
  getSneakerVariants,
  updateVariantStock,
} from '../controllers/sneakerController.js';

const router = express.Router();

// Rotas públicas
router.get('/', getSneakers);
router.get('/:slug', getSneakerBySlug);

// Rotas protegidas (adicionar middleware de autenticação quando implementado)
// router.post('/', createSneaker);
router.put('/:id', updateSneaker);
router.delete('/:id', deleteSneaker);
router.get('/:id/variants', getSneakerVariants);
router.put('/variants/:variantId/stock', updateVariantStock);

export default router;