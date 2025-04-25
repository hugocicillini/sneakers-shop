import mongoose from 'mongoose';

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
    // Preço base (pode ser sobrescrito por variante)
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Desconto base (pode ser sobrescrito por variante)
    baseDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Imagens gerais do produto
    coverImage: {
      url: {
        type: String,
        required: true,
      },
      alt: String,
    },
    defaultColor: {
      type: String,
      required: false, // Opcional no início, mas será definido no middleware
    },
    // Imagens específicas por cor
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
    // Lista de tamanhos possíveis (disponibilidade real nas variantes)
    availableSizes: {
      type: [Number],
      validate: {
        validator: function (sizes) {
          return sizes.every((size) => size >= 30 && size <= 48);
        },
        message: 'Tamanhos devem estar entre 30 e 48',
      },
    },
    // Lista de cores possíveis (disponibilidade real nas variantes)
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
    material: {
      type: String,
    },
    weight: {
      type: Number,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    warranty: {
      type: String,
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

// Virtual para acessar variantes
sneakerSchema.virtual('variants', {
  ref: 'SneakerVariant',
  localField: '_id',
  foreignField: 'sneaker',
});

// Virtual para acessar reviews
sneakerSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'sneaker',
});

// Pre-save hook para gerar slug automaticamente
sneakerSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // Gerar SKU automaticamente se não existir
  if (!this.sku) {
    const brandCode = this.brand.toString().substring(0, 3).toUpperCase();
    const nameCode = this.name.substring(0, 2).toUpperCase();
    const randomCode = Math.floor(1000 + Math.random() * 9000); // Número aleatório de 4 dígitos
    this.sku = `${brandCode}-${nameCode}-${randomCode}`;
  }

  // Garantir que haja uma cor padrão selecionada
  if (this.availableColors && this.availableColors.length > 0) {
    let defaultColorExists = false;
    let defaultColorValue = '';

    // Verifique se já existe uma cor marcada como padrão
    for (const colorItem of this.availableColors) {
      if (colorItem.isDefault) {
        defaultColorExists = true;
        defaultColorValue = colorItem.color;
        break;
      }
    }

    // Se não existir, defina a primeira como padrão
    if (!defaultColorExists) {
      this.availableColors[0].isDefault = true;
      defaultColorValue = this.availableColors[0].color;
    }

    // Sincronize o campo defaultColor com a cor padrão
    this.defaultColor = defaultColorValue;
  }

  next();
});

sneakerSchema.methods.getDefaultColor = function () {
  if (this.defaultColor) return this.defaultColor;

  const defaultColorItem = this.availableColors.find((c) => c.isDefault);
  return defaultColorItem
    ? defaultColorItem.color
    : this.availableColors[0]?.color || null;
};

// Método para calcular o rating médio com base nas reviews
sneakerSchema.methods.calculateAverageRating = async function () {
  // ...código existente...
};

// Método para obter imagens de uma cor específica
sneakerSchema.methods.getImagesByColor = function (color) {
  const colorImageSet = this.colorImages.find(
    (item) => item.color.toLowerCase() === color.toLowerCase()
  );
  return colorImageSet ? colorImageSet.images : this.images;
};

// Método para obter variantes disponíveis de uma cor específica
sneakerSchema.methods.getVariantsByColor = async function (color) {
  const SneakerVariant = mongoose.model('SneakerVariant');
  return await SneakerVariant.find({
    sneaker: this._id,
    color: color,
    isActive: true,
    stock: { $gt: 0 },
  });
};

// Método para verificar disponibilidade
sneakerSchema.methods.checkAvailability = async function (size, color) {
  // ...código existente...
};

// Índices para performance
sneakerSchema.index({ brand: 1, category: 1, isActive: 1 });
sneakerSchema.index({ name: 'text', description: 'text' });

export const Sneaker = mongoose.model('Sneaker', sneakerSchema);
