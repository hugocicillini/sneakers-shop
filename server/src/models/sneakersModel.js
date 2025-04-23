import mongoose from 'mongoose';

const sneakersSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    brand: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      maxLength: 200,
    },
    gender: {
      type: String,
      enum: ['masculino', 'feminino', 'unisex'],
      default: 'unisex',
    },
    sizes: {
      type: [Number],
      required: true,
      validate: {
        validator: function (sizes) {
          return sizes.every((size) => size >= 30 && size <= 48);
        },
        message: 'Tamanhos devem estar entre 30 e 48',
      },
    },
    colors: {
      type: [String],
    },
    totalStock: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      index: true,
    },
    tags: [String],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    relatedSneakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sneakers',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para acessar variantes
sneakersSchema.virtual('variants', {
  ref: 'SneakersVariant', // Referência ao modelo
  localField: '_id',
  foreignField: 'sneaker',
});

// Virtual para acessar reviews
sneakersSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'sneaker',
});

// Virtual para calcular o preço com desconto
sneakersSchema.virtual('finalPrice').get(function () {
  return this.discount > 0
    ? (this.price * (1 - this.discount / 100)).toFixed(2)
    : this.price.toFixed(2);
});

// Pre-save hook para gerar slug automaticamente
sneakersSchema.pre('save', function (next) {
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

// Método para calcular o rating médio com base nas reviews
sneakersSchema.methods.calculateAverageRating = async function () {
  try {
    const Review = mongoose.model('Review');
    const result = await Review.aggregate([
      { $match: { sneaker: this._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      this.rating = parseFloat(result[0].avgRating.toFixed(1));
      this.reviewCount = result[0].count;
    } else {
      this.rating = 0;
      this.reviewCount = 0;
    }

    await this.save();
    return this;
  } catch (error) {
    console.error('Erro ao calcular média de avaliações:', error);
    throw error;
  }
};

// Índice composto para melhorar a performance de consultas comuns
sneakersSchema.index({ brand: 1, category: 1, isActive: 1 });
sneakersSchema.index({ name: 'text', description: 'text', brand: 'text' });

export const Sneakers = mongoose.model('Sneakers', sneakersSchema);
