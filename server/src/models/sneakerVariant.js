import mongoose from 'mongoose';

const sneakerVariantSchema = new mongoose.Schema(
  {
    sneaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker',
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
    price: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
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

sneakerVariantSchema.pre('validate', async function (next) {
  try {
    if (
      this.isModified('finalPrice') &&
      !this.isModified('discount') &&
      this.price
    ) {
      if (this.finalPrice >= this.price) {
        this.discount = 0;
      } else {
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

sneakerVariantSchema.pre('save', async function (next) {
  try {
    if (this.isModified('price') || this.isModified('discount')) {
      await this.calculateFinalPrice();
    }
    next();
  } catch (error) {
    next(error);
  }
});

sneakerVariantSchema.methods.calculateFinalPrice = async function () {
  try {
    const price = this.price;
    const discount = this.discount;

    if (price !== undefined && price > 0 && discount !== undefined) {
      this.finalPrice =
        discount > 0
          ? parseFloat((price * (1 - discount / 100)).toFixed(2))
          : price;
    } else {
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
    logger.error('Erro ao calcular preço final:', error);
    return 0;
  }
};

sneakerVariantSchema.methods.setFinalPrice = async function (finalPrice) {
  if (!finalPrice || finalPrice <= 0) return false;

  try {
    let basePrice = this.price;

    if (!basePrice) {
      const Sneaker = mongoose.model('Sneaker');
      const sneaker = await Sneaker.findById(this.sneaker);
      basePrice = sneaker ? sneaker.basePrice : 0;
    }

    if (!basePrice || basePrice <= 0) return false;

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

sneakerVariantSchema.pre('save', async function (next) {
  if (this.isNew && !this.sku) {
    const Sneaker = mongoose.model('Sneaker');
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      const timestamp = Date.now().toString().slice(-4);
      const colorCode = this.color.slice(0, 3).toUpperCase();

      this.sku = `${sneaker.slug.substring(0, 8)}-${
        this.size
      }-${colorCode}-${timestamp}`;

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

sneakerVariantSchema.post('save', async function () {
  try {
    const Sneaker = mongoose.model('Sneaker');
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      const variants = await mongoose
        .model('SneakerVariant')
        .find({ sneaker: this.sneaker });
      const totalStock = variants.reduce(
        (sum, variant) => sum + variant.stock,
        0
      );

      sneaker.totalStock = totalStock;
      await sneaker.save();
    }
  } catch (error) {
    console.error('Erro ao atualizar estoque total:', error);
  }
});

sneakerVariantSchema.methods.getImages = async function () {
  const Sneaker = mongoose.model('Sneaker');
  const sneaker = await Sneaker.findById(this.sneaker);

  if (!sneaker) return [];

  return sneaker.getImagesByColor(this.color);
};

sneakerVariantSchema.index({ sneaker: 1, color: 1, size: 1 }, { unique: true });

export const SneakerVariant = mongoose.model(
  'SneakerVariant',
  sneakerVariantSchema
);
