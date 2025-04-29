import express from 'express';
import {
  createReview,
  getSneakerReviews,
} from '../controllers/reviewController.js';

const router = express.Router();

router.get('/sneaker/:sneakerId', getSneakerReviews); // Rota paginada para reviews de um sneaker específico
router.post('/', createReview); // Rota para editar um review específico
export default router;
