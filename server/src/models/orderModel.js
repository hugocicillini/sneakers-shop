const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [
      {
        sneakers: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sneakers',
          required: true
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SneakerVariant',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true
    },
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String
    },
    subtotalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    discountAmount: {
      type: Number,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: {
      type: Date
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String
  },
  {
    timestamps: true
  }
);

// Método para calcular o total do pedido
orderSchema.pre('save', function(next) {
  this.subtotalPrice = this.orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  this.totalPrice = this.subtotalPrice + this.shippingPrice - this.discountAmount;
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;