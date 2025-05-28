import mongoose from 'mongoose';
import { Cart } from '../models/cart.js';
import { Coupon } from '../models/coupon.js';
import { Sneaker } from '../models/sneaker.js';
import { SneakerVariant } from '../models/sneakerVariant.js';
import logger from '../utils/logger.js';

// Criar função auxiliar:
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

// Adicionar item ao carrinho - Versão refatorada
export const addToCart = async (req, res) => {
  try {
    // Extrair dados do corpo da requisição usando desestruturação
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

    // Adicionar validação para quantidade:
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser um número inteiro maior que zero',
      });
    }

    // Criar cartItemId único se não fornecido
    const cartItemId =
      req.body.cartItemId || `${sneakerId}-${size}-${color}-${Date.now()}`;

    // Validação simplificada
    if (!sneakerId || !variantId) {
      return res.status(400).json({
        success: false,
        message: 'sneakerId e variantId são obrigatórios',
        receivedBody: req.body,
      });
    }

    // Verificar se o tênis existe (necessário para adicionar ao banco de dados)
    const sneaker = await Sneaker.findById(sneakerId);
    if (!sneaker) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
        sneakerId,
      });
    }

    // Verificar se a variante existe (usando variantId diretamente)
    let variant;
    if (mongoose.Types.ObjectId.isValid(variantId)) {
      variant = await SneakerVariant.findById(variantId);
    }

    // Caso não encontre por ID, tentar por tamanho e cor
    if (!variant && size && color) {
      variant = await SneakerVariant.findOne({
        sneaker: sneakerId,
        size,
        color,
      });
    }

    // Se não encontrou a variante
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variante não encontrada',
        variantId,
        size,
        color,
      });
    }

    // Verificar estoque
    if (variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada não disponível em estoque',
        availableStock: variant.stock,
      });
    }

    // Para usuários não autenticados, retornar dados para armazenamento local
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
    }    // Usuário autenticado: processar adição ao carrinho
    let cart = await Cart.findOne({ user: req.user.id, status: 'active' });
    if (!cart) {
      // Criar um novo carrinho ativo se não existir
      cart = new Cart({ user: req.user.id, items: [] });
      logger.info(`Novo carrinho ativo criado para o usuário ${req.user.id} durante adição de item`);
    }

    // Usar a imagem fornecida pelo cliente se disponível, senão buscar do produto
    const productImage = getProductImage(sneaker, image);

    if (!productImage) {
      return res.status(400).json({
        success: false,
        message: 'Imagem do produto não encontrada',
        sneakerId,
      });
    }

    // Preparar dados do item com valores do cliente quando disponíveis
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

    // Verificar se item já existe e atualizar ou adicionar novo
    cart.addItem(cartItem);

    await cart.save();

    // Popular dados para resposta
    await cart.populate([
      { path: 'items.sneaker', select: 'name brand slug images finalPrice' },
      { path: 'items.variant', select: 'size color price stock' },
    ]);

    res.status(200).json({
      success: true,
      data: cart, // Sempre usar "data" para o dado principal
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

// Obter itens do carrinho
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
    ]);    if (!cart) {
      // Aqui apenas retornamos um objeto vazio sem criar um novo carrinho
      // Só criaremos um novo carrinho quando o usuário adicionar itens
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

// Atualizar quantidade de um item
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

    // Encontrar o item pelo cartItemId
    const item = cart.items.find((item) => item.cartItemId === cartItemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    }

    // Verificar estoque antes de atualizar
    const variant = await SneakerVariant.findById(item.variant);
    if (variant && variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada não disponível em estoque',
        availableStock: variant.stock,
      });
    }

    // Atualizar quantidade
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

// Remover item do carrinho - Versão melhorada
export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    // Lógica para usuários não logados
    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Item removido do carrinho (local storage)',
        cartItemId,
      });
    }

    // Lógica para usuários logados - encontrar o carrinho ativo
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

    // Encontrar índice do item pelo cartItemId
    const itemIndex = activeCart.items.findIndex(
      (item) => item.cartItemId === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    } // Remover o item
    activeCart.removeItem(cartItemId);

    // Manteremos o carrinho como ativo mesmo se estiver vazio
    // Isso permite que o usuário continue comprando sem problemas
    await activeCart.save();

    // Registrar a remoção para fins de log
    if (activeCart.items.length === 0) {
      console.log(`Carrinho ${activeCart._id} está vazio mas permanece ativo`);
    }

    // Popular dados para resposta se o carrinho ainda tiver itens
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

// Limpar carrinho inteiro
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
    } // Limpar os itens mas manter o carrinho ativo
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

// Sincronizar carrinho local com o servidor após login
export const syncCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum item para sincronizar',
      });
    }    // Buscar ou criar carrinho para o usuário
    let cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      // Só criamos um novo carrinho se tivermos itens do localStorage para adicionar
      cart = new Cart({ user: req.user.id, items: [] });
      logger.info(`Novo carrinho ativo criado para o usuário ${req.user.id} durante sincronização`);
    }

    // Processar cada item do carrinho local
    for (const localItem of items) {
      const { sneakerId, variantId, quantity } = localItem;

      if (!sneakerId || !variantId) continue;

      // Verificar se o tênis e a variante existem
      const [sneaker, variant] = await Promise.all([
        Sneaker.findById(sneakerId),
        SneakerVariant.findById(variantId),
      ]);

      if (!sneaker || !variant) continue;

      // Verificar se já existe no carrinho do servidor
      if (cart.hasItem(sneakerId, variantId)) {
        // Atualizar quantidade (somar a local com a que já existe)
        const serverItem = cart.findItem(sneakerId, variantId);
        serverItem.quantity = Math.min(
          serverItem.quantity + quantity,
          variant.stock
        );
      } else {
        // Adicionar novo item
        const cartItem = {
          sneaker: sneakerId,
          variant: variantId,
          quantity: Math.min(quantity, variant.stock),
          price: variant.price || sneaker.finalPrice || sneaker.price,
          priceAtTimeOfAddition:
            variant.price || sneaker.finalPrice || sneaker.price,
          name: sneaker.name,
          size: variant.size,
          color: variant.color,
          brand: sneaker.brand,
          image:
            sneaker.images.find((img) => img.isPrimary)?.url ||
            sneaker.images[0]?.url,
          slug: sneaker.slug,
          cartItemId: `${sneakerId}-${variant.size}-${
            variant.color
          }-${Date.now()}`,
        };

        cart.items.push(cartItem);
      }
    }

    await cart.save();

    await cart.populate([
      { path: 'items.sneaker', select: 'name brand slug images' },
      { path: 'items.variant', select: 'size color price stock' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Carrinho sincronizado com sucesso',
      cart,
    });
  } catch (error) {
    logger.error('Erro ao sincronizar carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sincronizar carrinho',
      error: error.message,
    });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Cupom para armazenamento local',
        couponCode: code,
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
      status: 'active',
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado',
      });
    }

    // Buscar o cupom no banco
    const coupon = await Coupon.findOne({
      code,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom inválido ou expirado',
      });
    }

    // Validar cupom para o carrinho atual
    const isValid = await coupon.isValid(cart.totalPrice, req.user.id);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Cupom não aplicável para este carrinho',
      });
    }

    // Aplicar desconto
    cart.appliedCouponCode = code;
    cart.discount = coupon.calculateDiscount(cart.totalPrice);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cupom aplicado com sucesso',
      data: cart,
    });
  } catch (error) {
    logger.error('Erro ao aplicar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aplicar cupom',
      error: error.message,
    });
  }
};
