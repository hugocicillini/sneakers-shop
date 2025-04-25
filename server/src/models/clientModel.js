import mongoose from 'mongoose';
import { User } from './userModel.js';

// Schema específico para clientes
const ClientSchema = new mongoose.Schema({
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker',
    },
  ],
  preferences: {
    favoriteCategories: [
      {
        type: String,
      },
    ],
    favoriteColors: [
      {
        type: String,
      },
    ],
    newsletterSubscribed: {
      type: Boolean,
      default: false,
    },
    shoeSize: {
      type: Number,
    },
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
});

// Criar o discriminador Client com base no modelo User
const Client = User.discriminator('Client', ClientSchema);

export { Client };
