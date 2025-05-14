import mongoose from 'mongoose';
import { Order } from '../models/order.js';
import logger from '../utils/logger.js';

// Criar um novo pedido
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      items,
      shippingAddress,
      shippingMethod,
      shippingPrice,
      paymentMethod,
      couponCode,
    } = req.body; // Verificações básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      logger.warn(`Tentativa de criar pedido sem itens por usuário ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Itens do pedido são obrigatórios',
      });
    }

    if (!shippingAddress) {
      logger.warn(
        `Tentativa de criar pedido sem endereço de entrega por usuário ${userId}`
      );
      return res.status(400).json({
        success: false,
        message: 'Endereço de entrega é obrigatório',
      });
    }

    // Calcular valores
    let itemsPrice = 0;
    let taxPrice = 0;
    let discountAmount = 0; // Mapear os itens para o formato correto do pedido e calcular preço total
    const orderItems = items.map((item) => {
      const price = parseFloat(item.price) || 0;
      itemsPrice += price * item.quantity;

      return {
        sneakers: item.sneakers || item.productId, // Aceitar ambos os formatos
        variant: item.variant || item.variantId, // Aceitar ambos os formatos
        quantity: item.quantity,
        price: price,
      };
    });

    // Calcular o total
    const totalPrice = (
      itemsPrice +
      parseFloat(shippingPrice || 0) +
      taxPrice -
      discountAmount
    ).toFixed(2);

    // Criar o pedido
    const order = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      shippingMethod,
      shippingPrice: parseFloat(shippingPrice || 0),
      paymentMethod,
      itemsPrice,
      taxPrice,
      discountAmount,
      totalPrice,
      couponCode,
      status: 'pending', // Status inicial
      paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos para pagamento
    });

    // Salvar o pedido
    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: savedOrder,
    });
  } catch (error) {
    logger.error(`Erro ao criar pedido: ${error.message}`);
    // Log detalhado dos dados para depuração
    logger.error(
      `Dados do pedido: ${JSON.stringify({
        userId,
        items: items.map((i) => ({
          sneakers: i.sneakers || i.productId,
          variant: i.variant || i.variantId,
          quantity: i.quantity,
          price: i.price,
        })),
        shippingAddress,
        shippingMethod,
      })}`
    );

    res.status(500).json({
      success: false,
      message: `Erro ao criar pedido: ${error.message}`,
    });
  }
};

// Buscar todos os pedidos do usuário atual
export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .populate('orderItems.sneakers', 'name images')
      .populate('orderItems.variant', 'size')
      .populate('shippingAddress');

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

// Buscar um pedido específico pelo ID
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, 'ID de pedido inválido'));
    }

    const order = await Order.findById(id)
      .populate('orderItems.sneakers')
      .populate('orderItems.variant')
      .populate('shippingAddress');

    if (!order) {
      return next(createError(404, 'Pedido não encontrado'));
    }

    // Verificar se o pedido pertence ao usuário atual
    if (order.user.toString() !== userId) {
      return next(createError(401, 'Não autorizado a visualizar este pedido'));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(createError(500, `Erro ao buscar pedido: ${error.message}`));
  }
};

// Atualizar um pedido (cancelar, etc.)
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, 'ID de pedido inválido'));
    }

    const order = await Order.findById(id);

    if (!order) {
      return next(createError(404, 'Pedido não encontrado'));
    }

    // Verificar se o pedido pertence ao usuário atual
    if (order.user.toString() !== userId) {
      return next(createError(401, 'Não autorizado a modificar este pedido'));
    }

    // Verificar se o status é válido para mudança pelo cliente
    if (status === 'cancelled') {
      // Apenas pedidos pendentes ou em processamento podem ser cancelados pelo cliente
      if (!['pending', 'processing'].includes(order.status)) {
        return next(
          createError(400, 'Este pedido não pode mais ser cancelado')
        );
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
    return next(createError(400, 'Operação de atualização não permitida'));
  } catch (error) {
    next(createError(500, `Erro ao atualizar pedido: ${error.message}`));
  }
};
