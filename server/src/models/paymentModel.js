const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['credit_card', 'debit_card', 'pix', 'boleto', 'paypal']
    },
    // Dados específicos para cartão
    cardDetails: {
      holderName: String,
      lastFourDigits: String,
      expiryMonth: Number,
      expiryYear: Number,
      brand: String
    },
    // Dados para outros métodos
    paymentToken: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Índice para buscar rapidamente métodos de pagamento padrão de um usuário
paymentSchema.index({ user: 1, isDefault: 1 });

// Middleware para garantir que apenas um método seja marcado como padrão
paymentSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;