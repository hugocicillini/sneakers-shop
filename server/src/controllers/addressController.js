import { Address } from '../models/addressModel.js';

/**
 * Busca todos os endereços de um usuário
 */
export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await Addresses.findById(userId);

    return res.status(200).json(addresses);
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Erro ao buscar endereços', error: error.message });
  }
};

/**
 * Busca o endereço padrão de um usuário
 */
export const getUserDefaultAddress = async (req, res) => {
  try {
    const { userId } = req.params;

    const defaultAddress = await Addresses.findDefaultByUserId(userId);

    if (!defaultAddress) {
      return res
        .status(404)
        .json({ message: 'Endereço padrão não encontrado' });
    }

    return res.status(200).json(defaultAddress);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao buscar endereço padrão',
      error: error.message,
    });
  }
};

/**
 * Cria um novo endereço
 */
export const createAddress = async (req, res) => {
  try {
    const requestData = req.body;

    // Extrair o objeto address que está aninhado na requisição
    const addressData = requestData.address || requestData;

    // Verificar se o userId está sendo enviado em outro nível
    const userId = requestData.userId || addressData.user;

    const isFirstAddress = await Addresses.findOne({ user: userId });

    if (isFirstAddress === null) addressData.isDefault = true;

    // Garantir que todos os campos estão sendo incluídos
    const newAddressData = {
      user: userId, // Usar o userId extraído
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
      // Se o novo endereço for padrão, remover o padrão dos outros endereços do usuário
      await Addresses.updateMany(
        { user: userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = new Addresses(newAddressData);
    await newAddress.save();

    // Obter o documento completo após salvar
    const savedAddress = await Addresses.findById(newAddress._id);

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

/**
 * Atualiza um endereço existente
 */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const addressData = req.body;

    // Buscar o endereço atual para comparações
    const currentAddress = await Addresses.findById(id);

    if (!currentAddress) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    // Verificar se este é o único endereço padrão e está sendo alterado para não-padrão
    if (currentAddress.isDefault === true && addressData.isDefault === false) {
      // Contar quantos endereços padrão o usuário tem
      const defaultCount = await Addresses.countDocuments({
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

    // Se o endereço está sendo definido como padrão, remover o padrão dos outros
    if (addressData.isDefault === true) {
      await Addresses.updateMany(
        {
          user: currentAddress.user,
          _id: { $ne: id }, // Não incluir o endereço atual
          isDefault: true,
        },
        { $set: { isDefault: false } }
      );
    }

    // Agora podemos atualizar o endereço
    const updatedAddressData = await Addresses.findByIdAndUpdate(
      id,
      addressData,
      { new: true, runValidators: true }
    );

    // Converte para objeto simples para garantir serialização adequada
    const addressObject = updatedAddressData.toObject
      ? updatedAddressData.toObject()
      : updatedAddressData;

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

/**
 * Remove um endereço
 */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o endereço antes de deletar
    const addressToDelete = await Addresses.findById(id);

    if (!addressToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    let newDefaultAddress = null;
    
    if (addressToDelete.isDefault) {
      const defaultCount = await Addresses.countDocuments({
        user: addressToDelete.user,
        isDefault: true,
      });

      if (defaultCount <= 1) {
        const totalAddresses = await Addresses.countDocuments({
          user: addressToDelete.user,
        });

        if (totalAddresses > 1) {
          const anotherAddress = await Addresses.findOne({
            user: addressToDelete.user,
            _id: { $ne: id },
          });

          if (anotherAddress) {
            newDefaultAddress = await Addresses.findByIdAndUpdate(
              anotherAddress._id,
              { isDefault: true },
              { new: true }
            );
          }
        }
      }
    }

    // Agora podemos excluir o endereço com segurança
    const deletedAddress = await Addresses.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Endereço removido com sucesso',
      newDefaultAddress: newDefaultAddress ? newDefaultAddress : null
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
