import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sneaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker', // Corrigido de 'Sneakers' para 'Sneaker'
      required: true,
    },
    comment: {
      type: String,
      required: true,
      maxLength: 500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Índices para melhorar consultas comuns
reviewSchema.index({ sneaker: 1, date: -1 });
reviewSchema.index({ user: 1, sneaker: 1 }); // Remove a restrição de unicidade

// Middleware para sinalizar ao produto que precisa recalcular a média de avaliações
reviewSchema.post('save', async function () {
  try {
    // Usando o modelo diretamente para evitar referência circular
    const Sneaker = mongoose.model('Sneaker'); // Corrigido de 'Sneakers' para 'Sneaker'
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      // Se encontrar o tênis, recalcula a média de avaliações
      await sneaker.calculateAverageRating();
    }
  } catch (error) {
    console.error('Erro ao recalcular média de avaliações:', error);
  }
});

export const Review = mongoose.model('Review', reviewSchema);
export { reviewSchema };
