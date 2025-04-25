const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['category_sale', 'product_sale', 'flash_sale', 'seasonal'],
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    banner: {
      type: String // URL da imagem promocional
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    applicableSneakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sneakers'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Método para verificar se uma promoção está ativa
promotionSchema.methods.isActive = function() {
  const now = new Date();
  return (
    this.isActive && 
    now >= this.startDate && 
    now <= this.endDate
  );
};

// Índice para buscar promoções ativas
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;