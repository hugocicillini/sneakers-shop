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

    // Buscar resumo de estatísticas + 5 reviews destacadas em uma única operação
    const [stats, featuredReviews] = await Promise.all([
      // Estatísticas completas em uma única agregação
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

      // As 5 melhores reviews verificadas (priorizando as mais recentes com alta avaliação)
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

    // Adicionar percentuais para cada nível de avaliação
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

    // Configurar a ordenação com base no parâmetro sort
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

    // Esta é a parte que implementa a paginação (10 em 10)
    const reviews = await Review.find({ sneaker: sneakerId, isVerified: true })
      .select('-__v')
      .populate('user', 'name -userType')
      .sort(sortOption)
      .skip(skip) // Pula os reviews já carregados
      .limit(limit); // Limita a 10 reviews por página

    const total = await Review.countDocuments({
      sneaker: sneakerId,
      isVerified: true,
    });

    // Obter estatísticas de rating
    const ratingStats = await Review.aggregate([
      { $match: { sneaker: sneakerId, isVerified: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    // Formatar estatísticas para fácil uso no frontend
    const stats = {};
    ratingStats.forEach((stat) => {
      stats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: reviews, // Os 10 reviews da página atual
      page, // Número da página atual
      pages: Math.ceil(total / limit), // Total de páginas
      total, // Total de reviews
      stats, // Estatísticas de rating
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

    // Verificar se o usuário já avaliou este produto
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

    // Criar o review
    const review = new Review({
      user: req.user._id,
      sneaker: sneakerId,
      rating: Number(rating),
      comment,
      isVerified: true, // Presumimos que o usuário fez uma compra verificada
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

    // Verificar se o review pertence ao usuário atual ou se é admin
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Atualizar campos
    review.rating = Number(rating) || review.rating;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();

    // O middleware post-save no model do review atualizará a média de avaliação do sneaker

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

    // Verificação de permissão (mantido como está)
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Salvar ID do sneaker antes de deletar
    const sneakerId = review.sneaker;

    // Usar método correto que aciona os hooks
    await Review.findByIdAndDelete(reviewId);

    // Atualizar manualmente só se os hooks não funcionarem
    const sneaker = await Sneaker.findById(sneakerId);
    if (sneaker) {
      // Usar o método correto que existe no modelo
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
