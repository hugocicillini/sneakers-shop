import mongoose from 'mongoose';
import { Cart } from '../models/cartModel.js';
import { Sneaker } from '../models/sneakerModel.js';
import { SneakerVariant } from '../models/sneakerVariantModel.js';

// Adicionar item ao carrinho
export const addToCart = async (req, res) => {
  try {
    // Melhorar o acesso aos dados do corpo da requisição
    const body = req.body;
    const sneakerId = body.sneakerId;
    const variantId = body.variantId;
    const quantity = body.quantity || 1;
    const color = body.color;
    const size = body.size;
    const cartItemId =
      body.cartItemId || `${sneakerId}-${size}-${color}-${Date.now()}`;

    // Validação mais detalhada para depuração
    if (!sneakerId) {
      return res.status(400).json({
        success: false,
        message: 'sneakerId é obrigatório',
        receivedBody: req.body,
      });
    }

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'variantId é obrigatório',
        receivedBody: req.body,
      });
    }

    // Verificar se o tênis existe
    const sneaker = await Sneaker.findById(sneakerId);
    if (!sneaker) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
        sneakerId,
      });
    }

    // Verificar se a variante existe e tem estoque
    let variant;

    // Tentar encontrar a variante usando o ID
    if (mongoose.Types.ObjectId.isValid(variantId)) {
      try {
        variant = await SneakerVariant.findById(variantId);
      } catch (error) {
        console.error('Erro ao buscar variante por ID:', error);
        // Continuar a execução - tentaremos encontrar de outra forma
      }
    }

    // Se não encontrou pelo ID, tentar encontrar pelos atributos (tamanho, cor)
    if (!variant && size && color) {
      try {
        variant = await SneakerVariant.findOne({
          sneaker: sneakerId,
          size: size,
          color: color,
        });
      } catch (error) {
        console.error('Erro ao buscar variante por atributos:', error);
      }
    }

    // Se ainda não encontrou a variante
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
        message: 'Quantidade solicitada não disponível em estoque',
        availableStock: variant.stock,
      });
    }

    // Para usuários não autenticados, retornar sucesso para gerenciar localmente
    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Item adicionado ao carrinho (local storage)',
        cartItem: {
          sneakerId,
          variantId,
          quantity,
        },
      });
    }

    // Usuário autenticado: salvar no banco de dados
    let cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Melhorar a forma como obtemos a imagem do produto
    let productImage = '';

    // Tenta obter a imagem da forma mais completa possível
    if (sneaker) {
      // 1. Primeiro tentar coverImage (novo formato)
      if (sneaker.coverImage && sneaker.coverImage.url) {
        productImage = sneaker.coverImage.url;
      }
      // 2. Depois tenta colorImages (se disponível)
      else if (sneaker.colorImages && sneaker.colorImages.length > 0) {
        const primaryImage = sneaker.colorImages.find((img) => img.isPrimary);
        productImage = primaryImage
          ? primaryImage.url
          : sneaker.colorImages[0].url;
      }
      // 3. Depois tenta images (formato anterior)
      else if (sneaker.images && sneaker.images.length > 0) {
        const primaryImage = sneaker.images.find((img) => img.isPrimary);
        productImage = primaryImage ? primaryImage.url : sneaker.images[0].url;
      }
      // 4. Por último, usa a imagem do item, se fornecida
      else if (req.body.image) {
        productImage = req.body.image;
      }
    }

    // Se após todas essas tentativas ainda não tiver imagem, retornar erro
    if (!productImage) {
      return res.status(400).json({
        success: false,
        message: 'Imagem do produto é obrigatória',
        sneakerId,
      });
    }

    // Preparar dados do item
    const price =
      variant.price ||
      (sneaker.price ? parseFloat(sneaker.finalPrice || sneaker.price) : 0);
    const cartItem = {
      sneaker: sneakerId,
      variant: variantId,
      quantity: quantity,
      price: parseFloat(price),
      priceAtTimeOfAddition: parseFloat(price),
      name: sneaker.name,
      size: variant.size,
      color: variant.color,
      brand: sneaker.brand,
      image: productImage, // Agora temos certeza que há uma imagem aqui
      slug: sneaker.slug || '',
      cartItemId,
    };

    // Verificar se o item já existe
    if (cart.hasItem(sneakerId, variantId)) {
      // Usar o método do schema para atualizar o item
      const existingItem = cart.findItem(sneakerId, variantId);
      // MODIFICADO: Somar a quantidade em vez de substituir
      existingItem.quantity += quantity;
    } else {
      // Adicionar novo item
      cart.items.push(cartItem);
    }

    await cart.save();

    // Popula os dados do tênis e variante para resposta mais rica
    await cart.populate([
      { path: 'items.sneaker', select: 'name brand slug images' },
      { path: 'items.variant', select: 'size color price stock' },
    ]);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error('Erro completo ao adicionar ao carrinho:', error);
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
      { path: 'items.sneaker', select: 'name brand slug images discount' },
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
    console.error('Erro ao buscar carrinho:', error);
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
    const variant = await SneakersVariant.findById(item.variant);
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
    console.error('Erro ao atualizar quantidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar quantidade',
      error: error.message,
    });
  }
};

// Remover item do carrinho
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

    // Lógica para usuários logados
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado',
      });
    }

    // Encontrar índice do item pelo cartItemId
    const itemIndex = cart.items.findIndex(
      (item) => item.cartItemId === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    }

    // Remover o item
    cart.items.splice(itemIndex, 1);

    // Se o carrinho ficar vazio, marcar como abandonado em vez de excluir
    if (cart.items.length === 0) {
      cart.status = 'abandoned';
    }

    await cart.save();

    if (cart.items.length > 0) {
      await cart.populate([
        { path: 'items.sneaker', select: 'name brand slug images' },
        { path: 'items.variant', select: 'size color price stock' },
      ]);
    }

    res.status(200).json({
      success: true,
      message: cart.items.length
        ? 'Item removido do carrinho'
        : 'Carrinho esvaziado',
      cart,
    });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover item do carrinho',
      error: error.message,
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
    }

    // Marcar como abandonado em vez de excluir
    cart.status = 'abandoned';
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Carrinho limpo com sucesso',
      cart,
    });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
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
    }

    // Buscar ou criar carrinho para o usuário
    let cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Processar cada item do carrinho local
    for (const localItem of items) {
      const { sneakerId, variantId, quantity } = localItem;

      if (!sneakerId || !variantId) continue;

      // Verificar se o tênis e a variante existem
      const [sneaker, variant] = await Promise.all([
        Sneaker.findById(sneakerId),
        SneakersVariant.findById(variantId),
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
    console.error('Erro ao sincronizar carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sincronizar carrinho',
      error: error.message,
    });
  }
};
