import mongoose from 'mongoose';
import { Review } from '../models/review.js';
import { Sneaker } from '../models/sneaker.js';
import logger from '../utils/logger.js';

export const getSneakerReviewPreview = async (req, res, next) => {
  try {
    const { sneakerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sneakerId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tênis inválido',
      });
    }

    const sneaker = await Sneaker.findById(sneakerId).lean();

    if (!sneaker) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
      });
    }

    const [stats, featuredReviews] = await Promise.all([
      Review.aggregate([
        {
          $match: {
            sneaker: new mongoose.Types.ObjectId(sneakerId),
            isVerified: true,
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            ratingsCount: { $push: { rating: '$rating', count: 1 } },
            avgRating: { $avg: '$rating' },
          },
        },
        {
          $project: {
            _id: 0,
            totalCount: 1,
            avgRating: { $round: ['$avgRating', 1] },
            ratingBreakdown: {
              $reduce: {
                input: '$ratingsCount',
                initialValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                in: {
                  1: {
                    $cond: [
                      { $eq: ['$$this.rating', 1] },
                      { $add: ['$$value.1', 1] },
                      '$$value.1',
                    ],
                  },
                  2: {
                    $cond: [
                      { $eq: ['$$this.rating', 2] },
                      { $add: ['$$value.2', 1] },
                      '$$value.2',
                    ],
                  },
                  3: {
                    $cond: [
                      { $eq: ['$$this.rating', 3] },
                      { $add: ['$$value.3', 1] },
                      '$$value.3',
                    ],
                  },
                  4: {
                    $cond: [
                      { $eq: ['$$this.rating', 4] },
                      { $add: ['$$value.4', 1] },
                      '$$value.4',
                    ],
                  },
                  5: {
                    $cond: [
                      { $eq: ['$$this.rating', 5] },
                      { $add: ['$$value.5', 1] },
                      '$$value.5',
                    ],
                  },
                },
              },
            },
          },
        },
      ]),

      Review.find({ sneaker: sneakerId, isVerified: true })
        .sort({ rating: -1, createdAt: -1 })
        .limit(5)
        .populate('user', 'name avatar'),
    ]);

    const ratingStats =
      stats.length > 0
        ? stats[0]
        : {
            totalCount: 0,
            avgRating: 0,
            ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };

    const withPercentages = {
      ...ratingStats,
      ratingPercentages: Object.entries(ratingStats.ratingBreakdown).reduce(
        (acc, [rating, count]) => {
          acc[rating] =
            ratingStats.totalCount > 0
              ? Math.round((count / ratingStats.totalCount) * 100)
              : 0;
          return acc;
        },
        {}
      ),
    };

    res.json({
      success: true,
      stats: withPercentages,
      featuredReviews,
      hasMore: ratingStats.totalCount > 5,
    });
  } catch (error) {
    logger.error('Erro ao buscar preview de reviews:', error);
    next(error);
  }
};

export const getSneakerReviews = async (req, res, next) => {
  try {
    const { sneakerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sneakerId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tênis inválido',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'recent';

    const sneakerExists = await Sneaker.findById(sneakerId);
    if (!sneakerExists) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
      });
    }

    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'highest':
        sortOption = { rating: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find({ sneaker: sneakerId, isVerified: true })
      .select('-__v')
      .populate('user', 'name -userType')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      sneaker: sneakerId,
      isVerified: true,
    });

    const ratingStats = await Review.aggregate([
      { $match: { sneaker: sneakerId, isVerified: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const stats = {};
    ratingStats.forEach((stat) => {
      stats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: reviews,
      page,
      pages: Math.ceil(total / limit),
      total,
      stats,
      averageRating: sneakerExists.rating,
    });
  } catch (error) {
    logger.error('Erro ao buscar reviews:', error);
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { sneakerId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sneakerId)) {
      return res.status(400).json({
        success: false,
        message: `ID de produto inválido: ${sneakerId}`,
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating deve ser um número entre 1 e 5',
      });
    }

    const sneaker = await Sneaker.findById(sneakerId);

    if (!sneaker) {
      return res.status(404).json({
        success: false,
        message: `Produto não encontrado com o ID: ${sneakerId}`,
      });
    }

    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      sneaker: sneakerId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Produto já foi avaliado por você',
      });
    }

    const review = new Review({
      user: req.user._id,
      sneaker: sneakerId,
      rating: Number(rating),
      comment,
      isVerified: true,
    });

    const createdReview = await review.save();

    res.status(201).json({
      success: true,
      data: createdReview,
    });
  } catch (error) {
    logger.error('Erro ao criar review:', error);
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de review inválido',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review não encontrado',
      });
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    review.rating = Number(rating) || review.rating;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();

    res.json({
      success: true,
      data: updatedReview,
    });
  } catch (error) {
    logger.error('Erro ao atualizar review:', error);
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de review inválido',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review não encontrada',
      });
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    const sneakerId = review.sneaker;

    await Review.findByIdAndDelete(reviewId);

    const sneaker = await Sneaker.findById(sneakerId);
    if (sneaker) {
      await sneaker.updateRatingInfo();
      await sneaker.save();
    }

    res.json({
      success: true,
      message: 'Review removida com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao deletar review:', error);
    next(error);
  }
};
