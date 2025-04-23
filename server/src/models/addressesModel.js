import mongoose from 'mongoose';

const addressesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Residencial', 'Comercial', 'Outro'],
      default: 'Residencial',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    complement: {
      type: String,
      trim: true,
    },
    neighborhood: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'addresses',
  }
);

export const Addresses = mongoose.model('Addresses', addressesSchema);
