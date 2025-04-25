import mongoose from 'mongoose';
import { User } from './userModel.js';

// Schema específico para administradores
const AdminSchema = User.discriminator(
  'Admin',
  new mongoose.Schema({
    role: {
      type: String,
      enum: ['super', 'manager', 'editor', 'support'],
      default: 'editor',
    },
    permissions: {
      products: {
        type: Boolean,
        default: true,
      },
      orders: {
        type: Boolean,
        default: false,
      },
      users: {
        type: Boolean,
        default: false,
      },
      promotions: {
        type: Boolean,
        default: false,
      },
      settings: {
        type: Boolean,
        default: false,
      },
    },
    department: {
      type: String,
      enum: ['marketing', 'sales', 'support', 'development', 'finance'],
      default: 'support',
    },
    lastPasswordChange: Date,
  })
);

// Método para verificar se o admin tem permissão específica
AdminSchema.methods.hasPermission = function(area) {
  if (this.role === 'super') return true;
  return this.permissions[area] === true;
};

export const Admin = AdminSchema;