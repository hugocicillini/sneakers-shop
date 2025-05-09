const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'signup',
        'order_created',
        'order_paid',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'password_changed',
        'account_updated',
        'product_reviewed',
        'admin_action',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    ip: String,
    userAgent: String,
    modelAffected: String,
    documentId: mongoose.Schema.Types.ObjectId,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para buscar atividades por usuário
activityLogSchema.index({ user: 1, createdAt: -1 });

// Índice para buscar por tipo de ação
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
