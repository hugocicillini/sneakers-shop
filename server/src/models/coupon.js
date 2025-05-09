import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed_amount'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPurchase: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null significa uso ilimitado
    },
    usesCount: {
      type: Number,
      default: 0,
    },
    maxUsesPerUser: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    applicableSneakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sneakers',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Método para validar se um cupom é aplicável
couponSchema.methods.isValid = function (user, cartTotal) {
  const now = new Date();

  // Verificar se o cupom está ativo
  if (!this.isActive) return false;

  // Verificar datas de validade
  if (now < this.startDate || (this.endDate && now > this.endDate))
    return false;

  // Verificar limite de usos totais
  if (this.maxUses !== null && this.usesCount >= this.maxUses) return false;

  // Verificar valor mínimo de compra
  if (cartTotal < this.minimumPurchase) return false;

  return true;
};

const Coupon = mongoose.model('Coupon', couponSchema);

export { Coupon, couponSchema };
