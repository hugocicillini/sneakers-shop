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
      enum: [
        'pending',
        'processing',
        'approved',
        'rejected',
        'refunded',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentExpiresAt: {
      type: Date,
      default: function () {
        return new Date(+new Date() + 24 * 60 * 60 * 1000); // 24 horas
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
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'returned',
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
    preferenceId: String,
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  this.total = this.subtotal + this.shipping.cost - this.discountAmount;

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
