import mongoose from 'mongoose';
import { User } from './user.js';

const clientSchema = new mongoose.Schema({
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  preferences: {
    favoriteCategories: [String],
    favoriteColors: [String],
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

clientSchema.methods.addLoyaltyPoints = function (points) {
  this.loyaltyPoints += points;
  return this.save();
};

const Client = User.discriminator('Client', clientSchema);

export { Client };
