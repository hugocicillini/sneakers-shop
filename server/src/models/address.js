import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Residencial', 'Comercial', 'Outro'],
      default: 'Residencial',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    complement: {
      type: String,
      trim: true,
    },
    neighborhood: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'addresses',
  }
);

addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    try {
      // Desmarcar qualquer outro endereço padrão deste usuário
      await this.constructor.updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );

      // Atualizar o defaultAddress no modelo Client
      // Usamos mongoose.model para evitar problemas de importação circular
      const Client = mongoose.model('Client');

      const client = await Client.findOne(this.user);

      if (client) {
        // Remover o filtro userType, pois já está implícito pelo modelo Client
        await Client.updateOne(
          { _id: this.user },
          { $set: { defaultAddress: this._id } }
        );
      }
    } catch (error) {
      logger.warn(`Erro ao atualizar endereços: ${error.message}`);
    }
  }
  next();
});

// Middleware para tratar exclusão de endereço padrão
addressSchema.pre('deleteOne', { document: true }, async function () {
  try {
    // Se o endereço sendo excluído for o padrão
    if (this.isDefault) {
      const Client = mongoose.model('Client');
      const client = await Client.findById(this.user);

      if (client) {
        // Remover a referência no cliente
        client.defaultAddress = undefined;
        await client.save();

        // Opcional: definir outro endereço como padrão
        const nextAddress = await Address.findOne({
          user: this.user,
          _id: { $ne: this._id },
        }).sort({ createdAt: -1 });

        if (nextAddress) {
          nextAddress.isDefault = true;
          await nextAddress.save();
        }
      }
    }
  } catch (error) {
    logger.warn(`Erro ao processar exclusão de endereço: ${error.message}`);
  }
});

addressSchema.methods.setAsDefault = async function () {
  this.isDefault = true;
  return this.save();
};

addressSchema.methods.getFormattedAddress = function () {
  return {
    fullAddress: `${this.street}, ${this.number}${
      this.complement ? ` - ${this.complement}` : ''
    }`,
    neighborhood: this.neighborhood,
    location: `${this.city} - ${this.state}`,
    zipCode: this.zipCode,
    recipient: this.recipient,
    type: this.type,
    isDefault: this.isDefault,
  };
};

const Address = mongoose.model('Address', addressSchema);

export { Address, addressSchema };
