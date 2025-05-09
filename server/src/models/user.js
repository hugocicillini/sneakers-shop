import mongoose from 'mongoose';
import bcrypt from 'mongoose-bcrypt';

// Schema base para todos os usuários
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
      bcrypt: true,
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    discriminatorKey: 'userType',
  }
);

userSchema.plugin(bcrypt);

userSchema.methods.checkPassword = function (password) {
  return this.verifyPasswordSync(password);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

export { User, userSchema };

