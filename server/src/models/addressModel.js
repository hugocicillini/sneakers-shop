import mongoose from 'mongoose';

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
    // Desmarcar qualquer outro endereço padrão deste usuário
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );

    try {
      // Atualizar o defaultAddress no modelo Client
      // Usamos mongoose.model para evitar problemas de importação circular
      const Client = mongoose.model('Client');

      // Remover o filtro userType, pois já está implícito pelo modelo Client
      await Client.updateOne(
        { _id: this.user },
        { $set: { defaultAddress: this._id } }
      );
    } catch (error) {
      // Se o modelo Client ainda não foi registrado ou outro erro ocorrer
      // Apenas registre o erro, mas não interrompa a operação
      console.log('Nota: Cliente não foi atualizado:', error.message);
    }
  }
  next();
});

export const Address = mongoose.model('Address', addressSchema);
