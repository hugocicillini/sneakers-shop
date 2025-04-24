import mongoose from 'mongoose';
import { Review } from '../models/reviewModel.js';
import { Sneakers } from '../models/sneakersModel.js';

/**
 * @desc    Obter todos os reviews (com paginação)
 * @route   GET /api/reviews
 * @access  Admin
 */
export const getAllReviews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({})
    .populate('user', 'name email')
    .populate('sneaker', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments();

  res.json({
    reviews,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

/**
 * @desc    Obter um review específico por ID
 * @route   GET /api/reviews/:id
 * @access  Admin
 */
export const getReviewById = async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name email')
    .populate('sneaker', 'name slug');

  if (review) {
    res.json(review);
  } else {
    res.status(404);
    throw new Error('Review não encontrado');
  }
};

/**
 * @desc    Obter reviews de um sneaker específico (com paginação e ordenação)
 * @route   GET /api/reviews/sneaker/:sneakerId
 * @access  Public
 */
export const getSneakerReviews = async (req, res) => {
  const { sneakerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Por padrão, busca 10 reviews por vez
  const skip = (page - 1) * limit; // Calcula quantos reviews pular (paginação)
  const sort = req.query.sort || 'recent';

  // Verificar se o sneaker existe
  const sneakerExists = await Sneakers.findById(sneakerId);
  if (!sneakerExists) {
    res.status(404);
    throw new Error('Sneaker não encontrado');
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
  const reviews = await Review.find({ sneaker: sneakerId })
    .populate('user', 'name')
    .sort(sortOption)
    .skip(skip) // Pula os reviews já carregados
    .limit(limit); // Limita a 10 reviews por página

  const total = await Review.countDocuments({ sneaker: sneakerId });

  // Obter estatísticas de rating
  const ratingStats = await Review.aggregate([
    { $match: { sneaker: sneakerId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  // Formatar estatísticas para fácil uso no frontend
  const stats = {};
  ratingStats.forEach((stat) => {
    stats[stat._id] = stat.count;
  });

  res.json({
    data: reviews, // Os 10 reviews da página atual
    page, // Número da página atual
    pages: Math.ceil(total / limit), // Total de páginas
    total, // Total de reviews
    stats, // Estatísticas de rating
    averageRating: sneakerExists.rating,
  });
};

/**
 * @desc    Criar um novo review
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = async (req, res) => {
  const { sneakerId, rating, comment } = req.body;

  // Verificação de ID válido para MongoDB
  if (!mongoose.Types.ObjectId.isValid(sneakerId)) {
    res.status(400);
    throw new Error(`ID de produto inválido: ${sneakerId}`);
  }

  // Verificar se o sneaker existe
  const sneaker = await Sneakers.findById(sneakerId);
  
  if (!sneaker) {
    res.status(404);
    throw new Error(`Produto não encontrado com o ID: ${sneakerId}`);
  }

  // Verificar se o usuário já avaliou este produto
  const alreadyReviewed = await Review.findOne({
    user: req.user._id,
    sneaker: sneakerId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Produto já foi avaliado por você');
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
  
  // O middleware post-save no model do review atualizará a média de avaliação do sneaker

  res.status(201).json(createdReview);
};

/**
 * @desc    Atualizar um review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export const updateReview = async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review não encontrado');
  }

  // Verificar se o review pertence ao usuário atual ou se é admin
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  // Atualizar campos
  review.rating = Number(rating) || review.rating;
  review.comment = comment || review.comment;

  const updatedReview = await review.save();

  // O middleware post-save no model do review atualizará a média de avaliação do sneaker

  res.json(updatedReview);
};

/**
 * @desc    Excluir um review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review não encontrado');
  }

  // Verificar se o review pertence ao usuário atual ou se é admin
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  await review.deleteOne();

  // Recalcular a média de avaliação manualmente já que o middleware post-save não será acionado
  const sneaker = await Sneakers.findById(review.sneaker);
  if (sneaker) {
    await sneaker.calculateAverageRating();
  }

  res.json({ message: 'Review removido' });
};
