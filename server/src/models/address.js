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
  try {
    if (this.isDefault && this.isModified('isDefault')) {
      // 1. Desmarcar todos os outros endereços padrão deste usuário
      await this.constructor.updateMany(
        {
          user: this.user,
          _id: { $ne: this._id },
          isDefault: true,
        },
        { $set: { isDefault: false } }
      );

      // 2. Atualizar o defaultAddress no modelo Client
      const Client = mongoose.model('Client');

      const updateResult = await Client.findByIdAndUpdate(
        this.user,
        { $set: { defaultAddress: this._id } },
        { new: true }
      );
    } else if (
      !this.isDefault &&
      this.isModified('isDefault') &&
      this.isNew === false
    ) {
      const Client = mongoose.model('Client');
      const client = await Client.findById(this.user);

      if (
        client &&
        client.defaultAddress &&
        client.defaultAddress.toString() === this._id.toString()
      ) {
        const newDefaultAddress = await this.constructor
          .findOne({
            user: this.user,
            _id: { $ne: this._id },
            isDefault: true,
          })
          .sort({ createdAt: -1 });

        if (newDefaultAddress) {
          await Client.findByIdAndUpdate(this.user, {
            $set: { defaultAddress: newDefaultAddress._id },
          });
        } else {
          await Client.findByIdAndUpdate(this.user, {
            $unset: { defaultAddress: 1 },
          });
        }
      }
    }
  } catch (error) {
    logger.error('Erro no middleware pre-save do Address:', error);
  }

  next();
});

addressSchema.pre('deleteOne', { document: true }, async function () {
  try {
    if (this.isDefault) {
      const Client = mongoose.model('Client');

      const nextAddress = await this.constructor
        .findOne({
          user: this.user,
          _id: { $ne: this._id },
        })
        .sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();

        await Client.findByIdAndUpdate(this.user, {
          $set: { defaultAddress: nextAddress._id },
        });
      } else {
        await Client.findByIdAndUpdate(this.user, {
          $unset: { defaultAddress: 1 },
        });
      }
    }
  } catch (error) {
    logger.error('Erro no middleware pre-deleteOne do Address:', error);
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
