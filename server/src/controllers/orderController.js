import mongoose from 'mongoose';
import { Cart } from '../models/cart.js';
import { Order } from '../models/order.js';
import logger from '../utils/logger.js';

/**
 * Cria um novo pedido com base no carrinho do usuário
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, shippingMethod, preferenceId } = req.body; // Buscar o carrinho do usuário - especificar que deve estar ativo
    const cart = await Cart.findOne({
      user: userId,
      status: 'active',
    }).populate('items.sneaker');

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Carrinho vazio. Não é possível criar o pedido.',
      });
    }

    // Calcular totais
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Calcular frete com base no método selecionado
    const shippingCost = calculateShippingCost(shippingMethod, subtotal);

    // Calcular total geral
    const total = subtotal + shippingCost;

    // Gerar número de pedido
    const orderNumber = generateOrderNumber();

    // Criar o pedido - agora incluindo preferenceId se vier do frontend
    const order = new Order({
      user: userId,
      orderNumber,
      items: cart.items.map((item) => ({
        sneaker: item.sneaker,
        variant: item.variant, // Adicionando o campo obrigatório variant
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
      })),
      subtotal,
      shipping: {
        method: shippingMethod,
        cost: shippingCost,
        address: shippingAddress,
      },
      total,
      status: 'pending', // Aguardando pagamento
      paymentStatus: 'pending',
      preferenceId: preferenceId || undefined, // Salva preferenceId se vier
    });
    await order.save();

    // Marcar o carrinho atual como convertido
    if (cart) {
      cart.status = 'converted';
      await cart.save();
      logger.info(
        `Carrinho ${cart._id} marcado como convertido após criação do pedido ${orderNumber}`
      );
      // Não criaremos um novo carrinho vazio aqui
      // Um novo carrinho será criado apenas quando o usuário adicionar novos itens
    }

    logger.info(`Novo pedido criado: ${orderNumber} para usuário ${userId}`);

    // Responder com o ID do pedido e outras informações relevantes
    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: {
        orderId: order._id,
        orderNumber,
        total,
      },
    });
  } catch (error) {
    logger.error(`Erro ao criar pedido: ${error.message}`);
    next(error);
  }
};

// Função auxiliar para calcular frete
function calculateShippingCost(shippingMethod, subtotal) {
  // Frete grátis para compras acima de R$ 300
  if (subtotal >= 300) return 0;

  switch (shippingMethod) {
    case 'express':
      return 29.9;
    case 'normal':
    default:
      return 19.9;
  }
}

// Função auxiliar para gerar número de pedido único
function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `P${timestamp.substring(timestamp.length - 6)}${random}`;
}

// Buscar pedido por ID
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('ID de pedido inválido');
      return res
        .status(400)
        .json({ success: false, message: 'ID de pedido inválido' });
    }

    // Corrige o populate para o nome correto dos campos
    const order = await Order.findById(id)
      .populate('items.sneaker')
      .populate('items.variant')
      .populate('shipping.address');

    if (!order) {
      logger.warn('Pedido não encontrado');
      return res
        .status(404)
        .json({ success: false, message: 'Pedido não encontrado' });
    }

    // Verificar se o pedido pertence ao usuário atual
    if (order.user.toString() !== userId) {
      logger.warn('Não autorizado a visualizar este pedido');
      return res
        .status(401)
        .json({
          success: false,
          message: 'Não autorizado a visualizar este pedido',
        });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error(`Erro ao buscar pedido: ${error.message}`);
    return res
      .status(500)
      .json({
        success: false,
        message: `Erro ao buscar pedido: ${error.message}`,
      });
  }
};

// Listar pedidos do usuário
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .populate('items.sneaker')
      .populate('items.variant')
      .populate('shipping.address');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    logger.error(`Erro ao buscar pedidos: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Erro ao buscar pedidos: ${error.message}`,
    });
  }
};

// Atualizar status do pedido
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('ID de pedido inválido');
      return res
        .status(400)
        .json({ success: false, message: 'ID de pedido inválido' });
    }

    const order = await Order.findById(id);

    if (!order) {
      logger.warn('Pedido não encontrado');
      return res
        .status(404)
        .json({ success: false, message: 'Pedido não encontrado' });
    }

    // Verificar se o pedido pertence ao usuário atual
    if (order.user.toString() !== userId) {
      logger.warn('Não autorizado a modificar este pedido');
      return res
        .status(401)
        .json({
          success: false,
          message: 'Não autorizado a modificar este pedido',
        });
    }

    // Verificar se o status é válido para mudança pelo cliente
    if (status === 'cancelled') {
      // Apenas pedidos pendentes ou em processamento podem ser cancelados pelo cliente
      if (!['pending', 'processing'].includes(order.status)) {
        logger.warn('Este pedido não pode mais ser cancelado');
        return res
          .status(400)
          .json({
            success: false,
            message: 'Este pedido não pode mais ser cancelado',
          });
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancellationReason = cancellationReason || 'Cancelado pelo cliente';

      const updatedOrder = await order.save();

      return res.status(200).json({
        success: true,
        message: 'Pedido cancelado com sucesso',
        data: updatedOrder,
      });
    }

    // Outras atualizações não são permitidas para o cliente
    logger.warn('Operação de atualização não permitida');
    return res
      .status(400)
      .json({
        success: false,
        message: 'Operação de atualização não permitida',
      });
  } catch (error) {
    logger.error(`Erro ao atualizar pedido: ${error.message}`);
    return res
      .status(500)
      .json({
        success: false,
        message: `Erro ao atualizar pedido: ${error.message}`,
      });
  }
};
