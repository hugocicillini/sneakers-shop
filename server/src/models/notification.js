const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['order_status', 'promotion', 'restock', 'system', 'price_drop']
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    relatedModel: {
      type: String,
      enum: ['Order', 'Sneakers', 'Promotion', 'Coupon']
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId
    },
    actionUrl: String
  },
  {
    timestamps: true
  }
);

// Índice para buscar notificações não lidas de um usuário
notificationSchema.index({ user: 1, isRead: 1 });

// Índice para buscar notificações por tipo
notificationSchema.index({ user: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;