import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual para acessar sneakers desta categoria
categorySchema.virtual('sneakers', {
  ref: 'Sneaker',
  localField: '_id',
  foreignField: 'category',
});

// Pre-save hook para gerar slug automaticamente
categorySchema.pre('save', function (next) {
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
categorySchema.index({ name: 'text' });
categorySchema.index({ isActive: 1 });

export const Category = mongoose.model('Category', categorySchema);
