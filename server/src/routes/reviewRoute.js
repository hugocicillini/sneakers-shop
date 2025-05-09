import express from 'express';
import {
  createReview,
  deleteReview,
  // getAllReviews,
  // getReviewById,
  getSneakerReviewPreview,
  getSneakerReviews,
  updateReview,
} from '../controllers/reviewController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas públicas
router.get('/sneaker/:sneakerId/preview', getSneakerReviewPreview); // Preview com 5 melhores reviews
router.get('/sneaker/:sneakerId', getSneakerReviews); // Reviews paginadas de um sneaker

// Rotas que requerem autenticação
router.post('/', authMiddleware, createReview); // Criar review (usuário logado)
router.put('/:reviewId', authMiddleware, updateReview); // Atualizar review própria
router.delete('/:reviewId', authMiddleware, deleteReview); // Deletar review própria

// // Rotas de admin
// router.get('/', authMiddleware, getAllReviews); // Listar todas as reviews (admin)
// router.get('/:id', authMiddleware, getReviewById); // Ver review específica (admin)

export default router;
