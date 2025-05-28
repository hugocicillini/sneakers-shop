import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
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
        image: {
          type: String,
          required: true,
        },
      },
    ],
    shipping: {
      address: {
        type: Object,
        required: true,
      },
      method: {
        type: String,
        required: true,
        enum: ['normal', 'express'],
      },
      cost: {
        type: Number,
        required: true,
        default: 0,
      },
      trackingNumber: String,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'pix', 'boleto'],
      required: false,
    },
    paymentId: {
      type: String,
    },
    paymentDetails: {
      type: Object,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'refunded', 'cancelled'],
      default: 'pending',
    },
    paymentExpiresAt: {
      type: Date,
      default: function () {
        return new Date(+new Date() + 24 * 60 * 60 * 1000); // 24 horas por padrão
      },
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
    },
    total: {
      type: Number,
      required: true,
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'pending', // Recebido
        'payment', // Pagamento
        'processing', // Separação
        'awaiting_shipment', // Aguardando Transporte
        'in_transit', // Em Transporte
        'delivered', // Entregue
        'cancelled', // Cancelado
        'failed', // Falha
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            'pending',
            'payment',
            'processing',
            'awaiting_shipment',
            'in_transit',
            'delivered',
            'cancelled',
            'failed',
          ],
        },
        date: {
          type: Date,
          default: Date.now,
        },
        comment: String,
      },
    ],
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    preferenceId: String, // Para Mercado Pago
  },
  {
    timestamps: true,
  }
);

// Método para calcular o total do pedido
orderSchema.pre('save', function (next) {
  // Calcular subtotal com base nos items
  this.subtotal = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Calcular total incluindo frete e descontos
  this.total = this.subtotal + this.shipping.cost - this.discountAmount;

  // Adicionar ao histórico de status se o status foi alterado
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      comment: 'Status atualizado automaticamente',
    });
  }

  next();
});

const Order = mongoose.model('Order', orderSchema);

export { Order };
