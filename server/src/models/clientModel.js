import mongoose from 'mongoose';
import { User } from './userModel.js';
// Importar o modelo Wishlist para garantir que esteja registrado

// Schema específico para clientes
const ClientSchema = new mongoose.Schema({
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  // Alterando para um array de IDs de Sneaker
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker', // Referência ao modelo Sneaker, não Wishlist
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
