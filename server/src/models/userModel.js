import mongoose from 'mongoose';
import bcrypt from 'mongoose-bcrypt';

// Schema base para todos os usuários
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      bcrypt: true,  // Hash automático usando mongoose-bcrypt
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    // Campo discriminador para identificar o tipo de usuário
    userType: {
      type: String,
      required: true,
      enum: ['client', 'admin'],
      default: 'client',
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'userType',  // Define o campo que será usado para distinguir os tipos
  }
);

// Adicionar plugin bcrypt para hash de senha
userSchema.plugin(bcrypt);

// Método para verificar login
userSchema.methods.checkPassword = function(password) {
  return this.verifyPasswordSync(password);
};

// Criar o modelo base
const User = mongoose.model('User', userSchema);

export { User, userSchema };