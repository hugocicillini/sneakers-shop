import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sneakers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Favorite = mongoose.model('Favorite', favoriteSchema);
