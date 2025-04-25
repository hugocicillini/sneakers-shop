import mongoose from 'mongoose';

const sneakerVariantSchema = new mongoose.Schema(
  {
    sneaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker', // Corrigido para singular
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    colorName: {
      type: String,
    },
    colorHex: {
      type: String,
    },
    // Preço específico desta variante (se null, usa o preço base do sneaker)
    price: {
      type: Number,
      min: 0,
    },
    // Desconto específico desta variante (se null, usa o desconto base do sneaker)
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'sneakerVariants', // Nome da coleção no MongoDB
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para calcular o preço final
sneakerVariantSchema.virtual('finalPrice').get(async function () {
  try {
    const price = this.price || 0;
    const discount = this.discount;

    // Se não tiver preço próprio ou desconto, buscar do produto principal
    if (!price || discount === undefined) {
      const Sneaker = mongoose.model('Sneaker');
      const sneaker = await Sneaker.findById(this.sneaker);

      if (sneaker) {
        const variantPrice = price || sneaker.basePrice;
        const variantDiscount =
          discount !== undefined ? discount : sneaker.baseDiscount;

        return variantDiscount > 0
          ? (variantPrice * (1 - variantDiscount / 100)).toFixed(2)
          : variantPrice.toFixed(2);
      }
    }

    // Se tiver preço e desconto próprios
    return discount > 0
      ? (price * (1 - discount / 100)).toFixed(2)
      : price.toFixed(2);
  } catch (error) {
    console.error('Erro ao calcular preço final:', error);
    return 0;
  }
});

// Validação para garantir SKU único
sneakerVariantSchema.pre('save', async function (next) {
  if (this.isNew && !this.sku) {
    // Gerar SKU automático baseado no ID do produto + tamanho + cor
    const Sneaker = mongoose.model('Sneaker');
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      // Criar um SKU baseado no slug do produto + tamanho + primeiras letras da cor
      const colorCode = this.color.slice(0, 3).toUpperCase();
      this.sku = `${sneaker.slug.substring(0, 8)}-${this.size}-${colorCode}`;

      // Preencher colorName e colorHex se não estiverem definidos
      if (!this.colorName || !this.colorHex) {
        const colorInfo = sneaker.availableColors.find(
          (c) => c.color === this.color
        );
        if (colorInfo) {
          this.colorName = this.colorName || colorInfo.colorName;
          this.colorHex = this.colorHex || colorInfo.colorHex;
        }
      }
    }
  }
  next();
});

// Middleware para atualizar o estoque total do produto
sneakerVariantSchema.post('save', async function () {
  try {
    // Usando o modelo diretamente para evitar referência circular
    const Sneaker = mongoose.model('Sneaker');
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      // Consulta para somar o estoque de todas as variantes
      const variants = await mongoose
        .model('SneakerVariant')
        .find({ sneaker: this.sneaker });
      const totalStock = variants.reduce(
        (sum, variant) => sum + variant.stock,
        0
      );

      // Atualiza o estoque total
      sneaker.totalStock = totalStock;
      await sneaker.save();
    }
  } catch (error) {
    console.error('Erro ao atualizar estoque total:', error);
  }
});

// Método para obter as imagens correspondentes a esta variante
sneakerVariantSchema.methods.getImages = async function () {
  const Sneaker = mongoose.model('Sneaker');
  const sneaker = await Sneaker.findById(this.sneaker);

  if (!sneaker) return [];

  return sneaker.getImagesByColor(this.color);
};

// Índices para performance
sneakerVariantSchema.index({ sneaker: 1, color: 1, size: 1 }, { unique: true });

export const SneakerVariant = mongoose.model(
  'SneakerVariant',
  sneakerVariantSchema
);
