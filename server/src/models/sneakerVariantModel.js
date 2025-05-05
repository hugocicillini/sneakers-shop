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
    // Preço final (calculado automaticamente)
    finalPrice: {
      type: Number,
      min: 0,
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
    collection: 'sneakerVariants',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware para calcular o finalPrice antes de validar
sneakerVariantSchema.pre('validate', async function (next) {
  try {
    // Se finalPrice foi fornecido diretamente e discount não foi modificado
    if (
      this.isModified('finalPrice') &&
      !this.isModified('discount') &&
      this.price
    ) {
      // Se o finalPrice é maior ou igual ao price, não há desconto
      if (this.finalPrice >= this.price) {
        this.discount = 0;
      } else {
        // Calcular desconto baseado no preço final fornecido
        const discountPercentage =
          ((this.price - this.finalPrice) / this.price) * 100;
        this.discount = parseFloat(discountPercentage.toFixed(2));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para calcular o finalPrice antes de salvar
sneakerVariantSchema.pre('save', async function (next) {
  try {
    // Calcular o finalPrice se price ou discount foram modificados
    if (this.isModified('price') || this.isModified('discount')) {
      await this.calculateFinalPrice();
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Método para calcular e atualizar o preço final
sneakerVariantSchema.methods.calculateFinalPrice = async function () {
  try {
    const price = this.price;
    const discount = this.discount;

    // Se tiver preço e desconto próprios
    if (price !== undefined && price > 0 && discount !== undefined) {
      this.finalPrice =
        discount > 0
          ? parseFloat((price * (1 - discount / 100)).toFixed(2))
          : price;
    }
    // Se não tiver preço ou desconto, buscar do produto principal
    else {
      const Sneaker = mongoose.model('Sneaker');
      const sneaker = await Sneaker.findById(this.sneaker);

      if (sneaker) {
        const variantPrice =
          price !== undefined && price > 0 ? price : sneaker.basePrice;
        const variantDiscount =
          discount !== undefined ? discount : sneaker.baseDiscount;

        this.finalPrice =
          variantDiscount > 0
            ? parseFloat(
                (variantPrice * (1 - variantDiscount / 100)).toFixed(2)
              )
            : variantPrice;
      } else {
        this.finalPrice = price || 0;
      }
    }

    return this.finalPrice;
  } catch (error) {
    console.error('Erro ao calcular preço final:', error);
    return 0;
  }
};

// Método para definir o preço final diretamente (e calcular o desconto)
sneakerVariantSchema.methods.setFinalPrice = async function (finalPrice) {
  if (!finalPrice || finalPrice <= 0) return false;

  try {
    // Determinar o preço base para cálculo do desconto
    let basePrice = this.price;

    // Se não tiver preço próprio, buscar do produto principal
    if (!basePrice) {
      const Sneaker = mongoose.model('Sneaker');
      const sneaker = await Sneaker.findById(this.sneaker);
      basePrice = sneaker ? sneaker.basePrice : 0;
    }

    if (!basePrice || basePrice <= 0) return false;

    // Calcular e definir o desconto apropriado
    if (finalPrice >= basePrice) {
      this.discount = 0;
    } else {
      const discountPercentage = ((basePrice - finalPrice) / basePrice) * 100;
      this.discount = parseFloat(discountPercentage.toFixed(2));
    }

    this.finalPrice = parseFloat(finalPrice.toFixed(2));
    return true;
  } catch (error) {
    console.error('Erro ao definir preço final:', error);
    return false;
  }
};

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
