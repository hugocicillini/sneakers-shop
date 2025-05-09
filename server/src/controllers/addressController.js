import mongoose from 'mongoose';
import { Address } from '../models/address.js';
import { Client } from '../models/client.js';
import logger from '../utils/logger.js';

export const getUserAddresses = async (req, res) => {
  try {
    // Usar o ID do usuário do middleware de autenticação
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

export const createAddress = async (req, res) => {
  try {
    const requestData = req.body;

    // Usar o ID do usuário do middleware de autenticação
    const userId = req.user._id;

    // Extrair o objeto address que está aninhado na requisição
    const addressData = requestData.address || requestData;

    const isFirstAddress = await Address.findOne({ user: userId });

    if (isFirstAddress === null) addressData.isDefault = true;

    const newAddressData = {
      user: userId, // Usar o ID do usuário autenticado
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

    // Se o endereço for padrão, atualizar o defaultAddress do cliente
    if (newAddressData.isDefault) {
      await Client.findByIdAndUpdate(userId, {
        defaultAddress: newAddress._id,
      });
    }

    // Obter o documento completo após salvar
    const savedAddress = await Address.findById(newAddress._id);

    // Converter para objeto simples para garantir serialização adequada
    const addressObject = savedAddress.toObject
      ? savedAddress.toObject()
      : savedAddress;

    return res.status(201).json({
      success: true,
      data: addressObject,
    });
  } catch (error) {
    logger.error('Erro ao criar endereço:', error);
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

    // Buscar o endereço atual para comparações
    const currentAddress = await Address.findById(addressId);

    if (!currentAddress) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    // Verificar se o endereço pertence ao usuário atual
    if (currentAddress.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para editar este endereço',
      });
    }

    // Verificar se este é o único endereço padrão e está sendo alterado para não-padrão
    if (currentAddress.isDefault === true && addressData.isDefault === false) {
      // Contar quantos endereços padrão o usuário tem
      const defaultCount = await Address.countDocuments({
        user: currentAddress.user,
        isDefault: true,
      });

      // Se este é o único endereço padrão, não permitir a alteração
      if (defaultCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            'Você deve ter pelo menos um endereço padrão. Defina outro endereço como padrão antes de alterar este.',
        });
      }
    }

    // OPÇÃO 1: Usar save() em vez de findByIdAndUpdate para aproveitar o hook
    Object.assign(currentAddress, addressData);
    await currentAddress.save();

    // Converte para objeto simples para garantir serialização adequada
    const addressObject = currentAddress.toObject
      ? currentAddress.toObject()
      : currentAddress;

    return res.status(200).json({
      success: true,
      data: addressObject,
    });
  } catch (error) {
    logger.error('Erro ao atualizar endereço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar endereço',
      error: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const userId = req.user._id; // Obter ID do usuário autenticado

    // Buscar o endereço antes de deletar
    const addressToDelete = await Address.findById(addressId);

    if (!addressToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    // Verificar se o endereço pertence ao usuário atual
    if (addressToDelete.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para excluir este endereço',
      });
    }

    let newDefaultAddress = null;

    if (addressToDelete.isDefault) {
      // Verificar se é o único endereço padrão
      const defaultCount = await Address.countDocuments({
        user: addressToDelete.user,
        isDefault: true,
      });

      // Se for o único endereço padrão, precisamos definir outro
      if (defaultCount <= 1) {
        // Buscar outro endereço para definir como padrão (o mais recente)
        const anotherAddress = await Address.findOne({
          user: addressToDelete.user,
          _id: { $ne: addressId },
        }).sort({ createdAt: -1 });

        if (anotherAddress) {
          // Encontrou outro endereço, defini-lo como padrão
          newDefaultAddress = await Address.findByIdAndUpdate(
            anotherAddress._id,
            { isDefault: true },
            { new: true }
          );

          // Atualizar a referência no cliente
          await Client.findByIdAndUpdate(addressToDelete.user, {
            defaultAddress: anotherAddress._id,
          });
        } else {
          // Não há outros endereços, remover referência do cliente
          await Client.findByIdAndUpdate(addressToDelete.user, {
            defaultAddress: null,
          });
        }
      }
    }

    // Agora podemos excluir o endereço com segurança
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
