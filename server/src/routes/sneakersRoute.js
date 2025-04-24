import express from 'express';
import {
  createSneakers,
  getSneakerById,
  getSneakerBySlug,
  getSneakers,
} from '../controllers/sneakersController.js';

const router = express.Router();

router.get('/', getSneakers);
router.get('/:slug', getSneakerBySlug);
router.get('/:id', getSneakerById);

router.post('/', createSneakers);

export default router;
