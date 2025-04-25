import mongoose from 'mongoose';
import cartItemSchema from './cartItemModel.js';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'abandoned', 'converted'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Método para calcular o preço total do carrinho
cartSchema.pre('save', function (next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});

// Método para verificar se um produto já existe no carrinho
cartSchema.methods.hasItem = function (sneakerId, variantId) {
  return this.items.some(
    (item) =>
      item.sneaker.toString() === sneakerId.toString() &&
      item.variant.toString() === variantId.toString()
  );
};

// Método para encontrar um item no carrinho
cartSchema.methods.findItem = function (sneakerId, variantId) {
  return this.items.find(
    (item) =>
      item.sneaker.toString() === sneakerId.toString() &&
      item.variant.toString() === variantId.toString()
  );
};

// Método para adicionar um produto ao carrinho
cartSchema.methods.addItem = function (item) {
  // Se o item já existe, atualizar a quantidade
  const existingItem = this.findItem(item.sneaker, item.variant);
  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    this.items.push(item);
  }
  // Recalcular o preço total
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

export const Cart = mongoose.model('Cart', cartSchema);
