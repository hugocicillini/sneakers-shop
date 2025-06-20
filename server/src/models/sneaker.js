import mongoose from 'mongoose';
import logger  from '../utils/logger.js';

const sneakerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    baseDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
    coverImage: {
      url: {
        type: String,
        required: true,
      },
      alt: String,
    },
    defaultColor: {
      type: String,
      required: false,
    },
    colorImages: [
      {
        color: {
          type: String,
          required: true,
        },
        colorName: {
          type: String,
          required: true,
        },
        colorHex: {
          type: String,
          default: '#000000',
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
      },
    ],
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
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
    availableSizes: {
      type: [Number],
      validate: {
        validator: function (sizes) {
          return sizes.every((size) => size >= 30 && size <= 48);
        },
        message: 'Tamanhos devem estar entre 30 e 48',
      },
    },
    availableColors: [
      {
        color: String,
        colorName: String,
        colorHex: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalStock: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    material: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    warranty: String,
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
        ref: 'Sneaker',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sneakerSchema.virtual('variants', {
  ref: 'SneakerVariant',
  localField: '_id',
  foreignField: 'sneaker',
});

sneakerSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'sneaker',
});

sneakerSchema.pre('validate', function (next) {
  if (
    this.basePrice > 0 &&
    this.baseDiscount >= 0 &&
    this.baseDiscount <= 100
  ) {
    const expectedFinalPrice = parseFloat(
      (this.basePrice * (1 - this.baseDiscount / 100)).toFixed(2)
    );

    const isConsistent = Math.abs(this.finalPrice - expectedFinalPrice) < 0.01;

    if (!isConsistent) {
      console.warn('Preços inconsistentes recebidos, ajustando finalPrice');
      this.finalPrice = expectedFinalPrice;
    }
  }

  next();
});

sneakerSchema.pre('save', function (next) {
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  this.slug = removeAccents(this.name);

  if (!this.sku) {
    const getBrandCode = async () => {
      try {
        const Brand = mongoose.model('Brand');
        const brand = await Brand.findById(this.brand);
        if (brand) {
          return brand.name.substring(0, 3).toUpperCase();
        }
      } catch (err) {
        logger.error(`Erro ao buscar marca: ${err.message}`);
      }
      return this.brand.toString().substring(0, 3).toUpperCase();
    };

    const getProductInitials = () => {
      const words = this.name.split(' ').filter((word) => word.length > 1);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return words[0].substring(0, 2).toUpperCase();
    };

    const currentYear = new Date().getFullYear();

    getBrandCode()
      .then((brandCode) => {
        this.sku = `${brandCode}-${getProductInitials()}-${currentYear}`;
      })
      .catch(() => {
        const brandCode = this.brand.toString().substring(0, 3).toUpperCase();
        this.sku = `${brandCode}-${getProductInitials()}-${currentYear}`;
      });
  }

  if (this.availableColors?.length > 0) {
    const defaultColor = this.availableColors.find((c) => c.isDefault);

    if (!defaultColor) {
      this.availableColors[0].isDefault = true;
      this.defaultColor = this.availableColors[0].color;
    } else {
      this.defaultColor = defaultColor.color;
    }
  }

  next();
});

sneakerSchema.methods.updateRatingInfo = async function () {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({
    sneaker: this._id,
    isVerified: true,
  });

  this.reviewCount = reviews.length;

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = parseFloat((totalRating / reviews.length).toFixed(1));
  } else {
    this.rating = 0;
  }

  return this.rating;
};

sneakerSchema.methods.checkInventory = async function (options = {}) {
  const SneakerVariant = mongoose.model('SneakerVariant');
  const query = { sneaker: this._id, isActive: true };

  if (options.size) query.size = options.size;
  if (options.color) query.color = options.color;
  if (options.inStock) query.stock = { $gt: 0 };

  return await SneakerVariant.find(query);
};

sneakerSchema.index({ brand: 1, category: 1, isActive: 1 });
sneakerSchema.index({ name: 'text', description: 'text' });

const Sneaker = mongoose.model('Sneaker', sneakerSchema);

export { Sneaker };
