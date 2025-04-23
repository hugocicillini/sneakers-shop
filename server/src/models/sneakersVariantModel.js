import mongoose from 'mongoose';

const sneakersVariantModel = new mongoose.Schema(
  {
    sneaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneakers',
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
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
    price: {
      type: Number,
      min: 0,
    }, // Preço específico da variante (opcional)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Validação para garantir SKU único
sneakersVariantModel.pre('save', async function (next) {
  if (this.isNew && !this.sku) {
    // Gerar SKU automático baseado no ID do produto + tamanho + cor
    const Sneakers = mongoose.model('Sneakers');
    const sneaker = await Sneakers.findById(this.sneaker);

    if (sneaker) {
      // Criar um SKU baseado no slug do produto + tamanho + primeiras letras da cor
      const colorCode = this.color.slice(0, 3).toUpperCase();
      this.sku = `${sneaker.slug.substring(0, 8)}-${this.size}-${colorCode}`;
    }
  }
  next();
});

// Middleware para atualizar o estoque total do produto
sneakersVariantModel.post('save', async function () {
  try {
    // Usando o modelo diretamente para evitar referência circular
    const Sneakers = mongoose.model('Sneakers');
    const sneaker = await Sneakers.findById(this.sneaker);

    if (sneaker) {
      // Consulta para somar o estoque de todas as variantes
      const variants = await mongoose
        .model('SneakersVariant') // Corrigido de 'Variant' para 'SneakersVariant'
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

export const SneakersVariant = mongoose.model('SneakersVariant', sneakersVariantModel);
export { sneakersVariantModel };
