import express from 'express';
import {
  createReview,
  deleteReview,
  getSneakerReviewPreview,
  getSneakerReviews,
  updateReview,
} from '../controllers/reviewController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.get('/sneaker/:sneakerId/preview', getSneakerReviewPreview);
router.get('/sneaker/:sneakerId', getSneakerReviews);

router.post('/', authMiddleware, createReview);
router.put('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);

export default router;
