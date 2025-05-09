import mongoose from 'mongoose';
import cartItemSchema from './cartItem.js';

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
    appliedCouponCode: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Método para calcular o preço total do carrinho
cartSchema.pre('save', function (next) {
  // Calcular o preço total dos itens
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calcular o preço final com desconto
  this.finalPrice = Math.max(0, this.totalPrice - this.discount);

  // Atualizar a data da última atividade
  this.lastActivity = new Date();

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
};

// Método para remover um item do carrinho
cartSchema.methods.removeItem = function (cartItemId) {
  const initialLength = this.items.length;
  this.items = this.items.filter((item) => item.cartItemId !== cartItemId);

  // Retorna se algo foi removido
  return initialLength > this.items.length;
};

// Método para atualizar a quantidade de um item
cartSchema.methods.updateItemQuantity = function (cartItemId, quantity) {
  const item = this.items.find((item) => item.cartItemId === cartItemId);
  if (item && quantity > 0) {
    item.quantity = quantity;
    return true;
  }
  return false;
};

// Método para limpar o carrinho
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.appliedCouponCode = null;
  this.discount = 0;
  return true;
};

// Método para verificar disponibilidade de todos os itens
cartSchema.methods.checkAvailability = async function () {
  const unavailableItems = [];

  for (const item of this.items) {
    const isAvailable = await item.validateAvailability();
    if (!isAvailable) {
      unavailableItems.push({
        cartItemId: item.cartItemId,
        name: item.name,
        size: item.size,
        requested: item.quantity,
        available: 0, // Este valor será atualizado pelo validateAvailability
      });
    }
  }

  return {
    isAvailable: unavailableItems.length === 0,
    unavailableItems,
  };
};

export const Cart = mongoose.model('Cart', cartSchema);
