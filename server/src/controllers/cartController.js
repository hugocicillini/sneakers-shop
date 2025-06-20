import mongoose from 'mongoose';
import { Cart } from '../models/cart.js';
import { Sneaker } from '../models/sneaker.js';
import { SneakerVariant } from '../models/sneakerVariant.js';
import logger from '../utils/logger.js';

const getProductImage = (sneaker, image) => {
  return (
    image ||
    sneaker.coverImage?.url ||
    sneaker.colorImages?.find((img) => img.isPrimary)?.url ||
    sneaker.colorImages?.[0]?.url ||
    sneaker.images?.find((img) => img.isPrimary)?.url ||
    sneaker.images?.[0]?.url
  );
};

export const addToCart = async (req, res) => {
  try {
    const {
      sneakerId,
      variantId,
      quantity = 1,
      color,
      size,
      image,
      name,
      price,
      originalPrice,
      brand,
      slug,
    } = req.body;

    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser um número inteiro maior que zero',
      });
    }

    const cartItemId =
      req.body.cartItemId || `${sneakerId}-${size}-${color}-${Date.now()}`;

    if (!sneakerId || !variantId) {
      return res.status(400).json({
        success: false,
        message: 'sneakerId e variantId são obrigatórios',
        receivedBody: req.body,
      });
    }

    const sneaker = await Sneaker.findById(sneakerId);
    if (!sneaker) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
        sneakerId,
      });
    }

    let variant;
    if (mongoose.Types.ObjectId.isValid(variantId)) {
      variant = await SneakerVariant.findById(variantId);
    }

    if (!variant && size && color) {
      variant = await SneakerVariant.findOne({
        sneaker: sneakerId,
        size,
        color,
      });
    }

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variante não encontrada',
        variantId,
        size,
        color,
      });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada não disponível em estoque',
        availableStock: variant.stock,
      });
    }

    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Item adicionado ao carrinho (local storage)',
        cartItem: {
          sneakerId,
          variantId,
          quantity,
          image,
          price,
          color,
          size,
        },
      });
    }
    let cart = await Cart.findOne({ user: req.user.id, status: 'active' });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
      logger.info(
        `Novo carrinho ativo criado para o usuário ${req.user.id} durante adição de item`
      );
    }

    const productImage = getProductImage(sneaker, image);

    if (!productImage) {
      return res.status(400).json({
        success: false,
        message: 'Imagem do produto não encontrada',
        sneakerId,
      });
    }

    const finalPrice =
      parseFloat(price) ||
      variant.price ||
      parseFloat(sneaker.finalPrice || sneaker.price || 0);
    const cartItem = {
      sneaker: sneakerId,
      variant: variantId,
      quantity,
      price: finalPrice,
      priceAtTimeOfAddition: finalPrice,
      name: name || sneaker.name,
      size: size || variant.size,
      color: color || variant.color,
      brand: brand || sneaker.brand,
      image: productImage,
      slug: slug || sneaker.slug || '',
      cartItemId,
    };

    cart.addItem(cartItem);

    await cart.save();

    await cart.populate([
      { path: 'items.sneaker', select: 'name brand slug images finalPrice' },
      { path: 'items.variant', select: 'size color price stock' },
    ]);

    res.status(200).json({
      success: true,
      data: cart,
      message: 'Item adicionado ao carrinho',
    });
  } catch (error) {
    logger.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar produto ao carrinho',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Carrinho gerenciado localmente',
        cart: { items: [] },
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
      status: 'active',
    }).populate([
      {
        path: 'items.sneaker',
        select: 'name brand slug finalPrice images discount',
      },
      { path: 'items.variant', select: 'size color price stock' },
    ]);
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Carrinho não encontrado',
        cart: { items: [] },
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    logger.error('Erro ao buscar carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar carrinho',
      error: error.message,
    });
  }
};

export const updateItemQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Item atualizado (local storage)',
        cartItemId,
        quantity,
      });
    }

    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado',
      });
    }

    const item = cart.items.find((item) => item.cartItemId === cartItemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    }

    const variant = await SneakerVariant.findById(item.variant);
    if (variant && variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada não disponível em estoque',
        availableStock: variant.stock,
      });
    }

    item.quantity = quantity;

    await cart.save();

    await cart.populate([
      { path: 'items.sneaker', select: 'name brand slug images' },
      { path: 'items.variant', select: 'size color price stock' },
    ]);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    logger.error('Erro ao atualizar quantidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar quantidade',
      error: error.message,
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Item removido do carrinho (local storage)',
        cartItemId,
      });
    }

    const activeCart = await Cart.findOne({
      user: req.user.id,
      status: 'active',
    });

    if (!activeCart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho ativo não encontrado',
      });
    }

    const itemIndex = activeCart.items.findIndex(
      (item) => item.cartItemId === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    }
    activeCart.removeItem(cartItemId);

    await activeCart.save();

    if (activeCart.items.length === 0) {
      console.log(`Carrinho ${activeCart._id} está vazio mas permanece ativo`);
    }

    if (activeCart.items.length > 0) {
      await activeCart.populate([
        { path: 'items.sneaker', select: 'name brand slug images finalPrice' },
        { path: 'items.variant', select: 'size color price stock' },
      ]);
    }

    res.status(200).json({
      success: true,
      message: activeCart.items.length
        ? 'Item removido do carrinho'
        : 'Carrinho esvaziado',
      cart: activeCart,
    });
  } catch (error) {
    logger.error('Erro ao remover item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover item do carrinho',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Carrinho limpo (local storage)',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Carrinho já estava vazio',
      });
    }
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Carrinho limpo com sucesso',
      cart,
    });
  } catch (error) {
    logger.error('Erro ao limpar carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar carrinho',
      error: error.message,
    });
  }
};
