import { Address } from '../models/addressModel.js';
import { Client } from '../models/clientModel.js';

export const getUserAddresses = async (req, res) => {
  try {
    // Usar o ID do usuário do middleware de autenticação
    const userId = req.user._id;

    const addresses = await Address.find({ user: userId });

    return res.status(200).json({
      success: true,
      addresses: addresses,
    });
  } catch (error) {
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

    if (addressData.isDefault === true) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

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
      address: addressObject,
    });
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar endereço',
      error: error.message,
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const addressData = req.body;
    const userId = req.user._id; // Obter ID do usuário autenticado

    // Buscar o endereço atual para comparações
    const currentAddress = await Address.findById(id);

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
      address: addressObject,
    });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar endereço',
      error: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('ID do endereço a ser excluído:', id);
    const userId = req.user._id; // Obter ID do usuário autenticado

    // Buscar o endereço antes de deletar
    const addressToDelete = await Address.findById(id);

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
      const defaultCount = await Address.countDocuments({
        user: addressToDelete.user,
        isDefault: true,
      });

      if (defaultCount <= 1) {
        const totalAddresses = await Address.countDocuments({
          user: addressToDelete.user,
        });

        if (totalAddresses > 1) {
          const anotherAddress = await Address.findOne({
            user: addressToDelete.user,
            _id: { $ne: id },
          });

          if (anotherAddress) {
            newDefaultAddress = await Address.findByIdAndUpdate(
              anotherAddress._id,
              { isDefault: true },
              { new: true }
            );

            // Atualizar o defaultAddress do cliente
            await Client.findByIdAndUpdate(addressToDelete.user, {
              defaultAddress: anotherAddress._id,
            });
          }
        } else {
          // Se não houver outro endereço, definir defaultAddress como null
          await Client.findByIdAndUpdate(addressToDelete.user, {
            defaultAddress: null,
          });
        }
      }
    }

    // Agora podemos excluir o endereço com segurança
    const deletedAddress = await Address.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Endereço removido com sucesso',
      newDefaultAddress: newDefaultAddress ? newDefaultAddress : null,
    });
  } catch (error) {
    console.error('Erro ao remover endereço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover endereço',
      error: error.message,
    });
  }
};
