import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    logo: {
      type: String,
      default: '/images/default-brand.png'
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true
  }
);

// Virtual para acessar sneakers desta marca
brandSchema.virtual('sneakers', {
  ref: 'Sneaker',
  localField: '_id',
  foreignField: 'brand',
});

// Pre-save hook para gerar slug automaticamente
brandSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

// Índice para performance em buscas por nome
brandSchema.index({ name: 'text' });
brandSchema.index({ isActive: 1 });

export const Brand = mongoose.model('Brand', brandSchema);
