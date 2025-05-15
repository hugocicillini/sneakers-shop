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
    // NOVO: Limite máximo de desconto para cupons percentuais
    maxDiscountValue: {
      type: Number,
      default: null, // null significa sem limite
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
    // NOVO: Rastreamento de usuários que usaram o cupom
    usedByUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    // NOVO: Compatibilidade com outros cupons
    canBeCombined: {
      type: Boolean,
      default: false,
    },
    // NOVO: Segmentação por tipo de usuário
    userType: {
      type: String,
      enum: ['all', 'new', 'returning', 'vip'],
      default: 'all',
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
        ref: 'Sneaker',
      },
    ],
    // NOVO: Exclusões específicas de produtos
    excludedSneakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sneaker',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Método para validar se um cupom é aplicável
couponSchema.methods.isValid = function (user, cartTotal, cartItems = []) {
  const now = new Date();

  // Verificar se o cupom está ativo
  if (!this.isActive) return { valid: false, message: 'Cupom inativo.' };

  // Verificar datas de validade
  if (now < this.startDate || (this.endDate && now > this.endDate))
    return { valid: false, message: 'Cupom fora do período de validade.' };

  // Verificar limite de usos totais
  if (this.maxUses !== null && this.usesCount >= this.maxUses)
    return { valid: false, message: 'Limite de usos do cupom atingido.' };

  // Verificar valor mínimo de compra
  if (cartTotal < this.minimumPurchase)
    return {
      valid: false,
      message: `Valor mínimo de compra: R$ ${this.minimumPurchase.toFixed(2)}`,
    };

  // Verificar uso por usuário específico
  if (user && user._id) {
    const userUsage = this.usedByUsers.filter(
      (usage) => usage.userId.toString() === user._id.toString()
    ).length;

    if (userUsage >= this.maxUsesPerUser)
      return {
        valid: false,
        message: 'Você já atingiu o limite de uso deste cupom.',
      };
  }

  // Verificar tipo de usuário
  if (user && this.userType !== 'all') {
    // Esta parte requer mais lógica no seu sistema para identificar o tipo de usuário
    // Exemplo simples:
    if (this.userType === 'new' && user.orderCount > 0)
      return {
        valid: false,
        message: 'Cupom válido apenas para novos clientes.',
      };

    if (this.userType === 'returning' && user.orderCount === 0)
      return {
        valid: false,
        message: 'Cupom válido apenas para clientes recorrentes.',
      };

    // Para "vip" precisaria de uma lógica específica do seu sistema
  }

  // Verificar restrições de produto (se houver itens e restrições)
  if (
    cartItems.length > 0 &&
    (this.applicableCategories.length > 0 || this.applicableSneakers.length > 0)
  ) {
    const hasApplicableItem = cartItems.some((item) => {
      // Verificar se o produto está excluído
      if (
        this.excludedSneakers.length > 0 &&
        this.excludedSneakers.some(
          (id) => id.toString() === item.sneakerId.toString()
        )
      ) {
        return false;
      }

      // Verificar se o produto está na lista de aplicáveis
      if (
        this.applicableSneakers.length > 0 &&
        this.applicableSneakers.some(
          (id) => id.toString() === item.sneakerId.toString()
        )
      ) {
        return true;
      }

      // Verificar se a categoria do produto está na lista de aplicáveis
      if (
        this.applicableCategories.length > 0 &&
        item.categoryId &&
        this.applicableCategories.some(
          (id) => id.toString() === item.categoryId.toString()
        )
      ) {
        return true;
      }

      return false;
    });

    if (!hasApplicableItem)
      return {
        valid: false,
        message: 'Este cupom não é aplicável aos produtos do seu carrinho.',
      };
  }

  return { valid: true, message: 'Cupom válido' };
};

// Método para aplicar o desconto ao valor total
couponSchema.methods.applyDiscount = function (total) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (this.discountValue / 100) * total;

    // Aplicar limite máximo se existir
    if (this.maxDiscountValue && discountAmount > this.maxDiscountValue) {
      discountAmount = this.maxDiscountValue;
    }
  } else if (this.discountType === 'fixed_amount') {
    discountAmount = Math.min(this.discountValue, total);
  }

  return {
    total: total - discountAmount,
    discountAmount: discountAmount,
  };
};

const Coupon = mongoose.model('Coupon', couponSchema);

export { Coupon, couponSchema };
