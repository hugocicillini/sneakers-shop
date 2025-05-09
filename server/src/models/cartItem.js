import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    sneaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker',
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SneakerVariant',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    priceAtTimeOfAddition: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    cartItemId: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      get() {
        return this.price - this.discount;
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    outOfStockNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual para calcular subtotal
cartItemSchema.virtual('subtotal').get(function () {
  return this.price * this.quantity;
});

// Virtual para calcular subtotal com desconto
cartItemSchema.virtual('subtotalWithDiscount').get(function () {
  return (this.price - this.discount) * this.quantity;
});

cartItemSchema.methods.validateAvailability = async function () {
  const SneakerVariant = mongoose.model('SneakerVariant');
  const variant = await SneakerVariant.findById(this.variant);

  if (!variant) {
    this.isAvailable = false;
    return false;
  }

  const isAvailable = variant.stock >= this.quantity;
  this.isAvailable = isAvailable;

  return isAvailable;
};

export default cartItemSchema;
