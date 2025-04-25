import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sneakers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneakers', // Corrigir para o nome exato do seu modelo
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adiciona updatedAt automaticamente
  collection: 'wishlists'
});

// Adicionar índice para melhorar performance
wishlistSchema.index({ user: 1 });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);