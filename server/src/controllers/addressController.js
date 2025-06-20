import mongoose from 'mongoose';
import { Address } from '../models/address.js';
import { Client } from '../models/client.js';
import logger from '../utils/logger.js';

export const createAddress = async (req, res) => {
  try {
    const requestData = req.body;
    const userId = req.user._id;
    const addressData = requestData.address || requestData;

    const existingAddresses = await Address.find({ user: userId });
    const isFirstAddress = existingAddresses.length === 0;

    if (isFirstAddress) {
      addressData.isDefault = true;
    }

    const newAddressData = {
      user: userId,
      type: addressData.type,
      isDefault: addressData.isDefault || false,
      recipient: addressData.recipient,
      phoneNumber: addressData.phoneNumber,
      zipCode: addressData.zipCode,
      street: addressData.street,
      number: addressData.number,
      complement: addressData.complement || '',
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
      reference: addressData.reference || '',
    };

    const newAddress = new Address(newAddressData);
    await newAddress.save();

    if (newAddress.isDefault) {
      const updatedClient = await Client.findByIdAndUpdate(
        userId,
        { defaultAddress: newAddress._id },
        { new: true }
      );
    }

    const savedAddress = await Address.findById(newAddress._id);
    const addressObject = savedAddress.toObject
      ? savedAddress.toObject()
      : savedAddress;

    return res.status(201).json({
      success: true,
      data: addressObject,
    });
  } catch (error) {
    logger.error('Erro ao criar endereço:', error);
    console.error('❌ Erro detalhado:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar endereço',
      error: error.message,
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const addressData = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de endereço inválido',
      });
    }

    const currentAddress = await Address.findById(addressId);

    if (!currentAddress) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    if (currentAddress.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para editar este endereço',
      });
    }

    if (currentAddress.isDefault === true && addressData.isDefault === false) {
      const totalAddresses = await Address.countDocuments({ user: userId });

      if (totalAddresses === 1) {
        return res.status(400).json({
          success: false,
          message: 'Você deve ter pelo menos um endereço padrão.',
        });
      }

      const otherAddresses = await Address.countDocuments({
        user: userId,
        _id: { $ne: addressId },
      });

      if (otherAddresses === 0) {
        return res.status(400).json({
          success: false,
          message: 'Você deve ter pelo menos um endereço padrão.',
        });
      }
    }

    Object.assign(currentAddress, addressData);
    await currentAddress.save();

    if (currentAddress.isDefault) {
      const client = await Client.findById(userId);
      if (
        client &&
        (!client.defaultAddress ||
          client.defaultAddress.toString() !== currentAddress._id.toString())
      ) {
        await Client.findByIdAndUpdate(userId, {
          defaultAddress: currentAddress._id,
        });
      }
    }

    const addressObject = currentAddress.toObject
      ? currentAddress.toObject()
      : currentAddress;

    return res.status(200).json({
      success: true,
      data: addressObject,
    });
  } catch (error) {
    logger.error('Erro ao atualizar endereço:', error);
    console.error('❌ Erro detalhado:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar endereço',
      error: error.message,
    });
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user._id;

    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    logger.error('Erro ao buscar endereços:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar endereços',
      error: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user._id;

    const addressToDelete = await Address.findById(addressId);

    if (!addressToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    if (addressToDelete.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para excluir este endereço',
      });
    }

    let newDefaultAddress = null;

    if (addressToDelete.isDefault) {
      const defaultCount = await Address.countDocuments({
        user: addressToDelete.user,
        isDefault: true,
      });

      if (defaultCount <= 1) {
        const anotherAddress = await Address.findOne({
          user: addressToDelete.user,
          _id: { $ne: addressId },
        }).sort({ createdAt: -1 });

        if (anotherAddress) {
          newDefaultAddress = await Address.findByIdAndUpdate(
            anotherAddress._id,
            { isDefault: true },
            { new: true }
          );

          await Client.findByIdAndUpdate(addressToDelete.user, {
            defaultAddress: anotherAddress._id,
          });
        } else {
          await Client.findByIdAndUpdate(addressToDelete.user, {
            defaultAddress: null,
          });
        }
      }
    }

    await addressToDelete.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Endereço removido com sucesso',
      newDefaultAddress: newDefaultAddress || null,
    });
  } catch (error) {
    logger.error('Erro ao remover endereço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover endereço',
      error: error.message,
    });
  }
};
