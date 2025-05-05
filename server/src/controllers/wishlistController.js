import { Client } from '../models/clientModel.js';
import { Sneaker } from '../models/sneakerModel.js';
import { SneakerVariant } from '../models/sneakerVariantModel.js';
// Adicionar um tênis aos favoritos
export const addFavorite = async (req, res) => {
  try {
    const { sneakerId } = req.body;
    const userId = req.user._id; // Obtém ID do usuário autenticado via middleware

    // Verificar se o tênis existe
    const existingSneaker = await Sneaker.findById(sneakerId);
    if (!existingSneaker) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
      });
    }

    // Buscar cliente e atualizar sua wishlist
    const client = await Client.findById(userId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Inicializar wishlist se não existir
    if (!client.wishlist) {
      client.wishlist = [];
    }

    // Verificar se o tênis já está na wishlist
    if (!client.wishlist.includes(sneakerId)) {
      client.wishlist.push(sneakerId);
      await client.save();
    }

    // Retornar a wishlist atualizada
    res.status(200).json({
      success: true,
      wishlist: client.wishlist,
    });
  } catch (error) {
    console.error('Erro no addFavorite:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar aos favoritos',
      error: error.message,
    });
  }
};

// Obtém os favoritos do usuário autenticado
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar cliente com wishlist populada, incluindo a marca de cada tênis
    const client = await Client.findById(userId).populate({
      path: 'wishlist',
      populate: {
        path: 'brand',
        select: 'name slug logo', // Selecionar os campos da marca que precisamos
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Para cada sneaker, buscar as variantes diretamente
    const wishlistWithVariants = await Promise.all(
      (client.wishlist || []).map(async (sneaker) => {
        const variants = await SneakerVariant.find({
          sneaker: sneaker._id,
        }).select('size color stock isAvailable');
        // Extrai as cores das variantes que têm estoque > 0
        const colorsInStock = [
          ...new Set(
            variants
              .filter((variant) => variant.stock > 0)
              .map((variant) => variant.color)
          ),
        ];
        return {
          ...sneaker.toObject(),
          colorsInStock,
          sizesInStock: variants,
        };
      })
    );

    res.status(200).json({
      success: true,
      wishlist: wishlistWithVariants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar favoritos',
      error: error.message,
    });
  }
};

// Remover um tênis dos favoritos
export const removeFavorite = async (req, res) => {
  try {
    const { sneakerId } = req.params;
    const userId = req.user._id; // Usando ID do middleware

    // Buscar cliente
    const client = await Client.findById(userId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Verificar se o tênis está na wishlist
    const index = client.wishlist.indexOf(sneakerId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não está nos favoritos',
      });
    }

    // Remover o tênis da wishlist
    client.wishlist.splice(index, 1);
    await client.save();

    res.status(200).json({
      success: true,
      message: 'Tênis removido dos favoritos',
      wishlist: client.wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao remover dos favoritos',
      error: error.message,
    });
  }
};
