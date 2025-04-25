import mongoose from 'mongoose';
import { User } from './userModel.js';

// Schema específico para clientes
const ClientSchema = User.discriminator(
  'Client',
  new mongoose.Schema({
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
  })
);

export const Client = ClientSchema;
