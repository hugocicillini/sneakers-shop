import mongoose from 'mongoose';
import { Cart } from '../models/cart.js';
import { Order } from '../models/order.js';
import logger from '../utils/logger.js';

function calculateShippingCost(shippingMethod, subtotal) {
  if (subtotal >= 300) return 0;

  switch (shippingMethod) {
    case 'express':
      return 29.9;
    case 'normal':
    default:
      return 19.9;
  }
}

function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `P${timestamp.substring(timestamp.length - 6)}${random}`;
}

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, shippingMethod, preferenceId } = req.body;
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

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const shippingCost = calculateShippingCost(shippingMethod, subtotal);

    const total = subtotal + shippingCost;

    const orderNumber = generateOrderNumber();

    const order = new Order({
      user: userId,
      orderNumber,
      items: cart.items.map((item) => ({
        sneaker: item.sneaker,
        variant: item.variant,
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
      status: 'pending',
      paymentStatus: 'pending',
      preferenceId: preferenceId || undefined,
    });
    await order.save();

    logger.info(`Novo pedido criado: ${orderNumber} para usuário ${userId}`);

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

export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      logger.warn('ID de pedido inválido');
      return res
        .status(400)
        .json({ success: false, message: 'ID de pedido inválido' });
    }

    const order = await Order.findById(orderId)
      .populate('items.sneaker')
      .populate('items.variant')
      .populate('shipping.address');

    if (!order) {
      logger.warn('Pedido não encontrado');
      return res
        .status(404)
        .json({ success: false, message: 'Pedido não encontrado' });
    }

    if (order.user.toString() !== userId) {
      logger.warn('Não autorizado a visualizar este pedido');
      return res.status(401).json({
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
    return res.status(500).json({
      success: false,
      message: `Erro ao buscar pedido: ${error.message}`,
    });
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { user: userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('items.sneaker', 'name images brand')
        .populate('items.variant', 'size color')
        .populate('shipping.address')
        .lean(),

      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        status: status || 'all',
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    logger.error(
      `Erro ao buscar pedidos do usuário ${req.user.id}: ${error.message}`
    );
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { status, cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      logger.warn('ID de pedido inválido');
      return res
        .status(400)
        .json({ success: false, message: 'ID de pedido inválido' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      logger.warn('Pedido não encontrado');
      return res
        .status(404)
        .json({ success: false, message: 'Pedido não encontrado' });
    }

    if (order.user.toString() !== userId) {
      logger.warn('Não autorizado a modificar este pedido');
      return res.status(401).json({
        success: false,
        message: 'Não autorizado a modificar este pedido',
      });
    }

    if (status === 'cancelled') {
      if (!['pending', 'processing'].includes(order.status)) {
        logger.warn('Este pedido não pode mais ser cancelado');
        return res.status(400).json({
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

    logger.warn('Operação de atualização não permitida');
    return res.status(400).json({
      success: false,
      message: 'Operação de atualização não permitida',
    });
  } catch (error) {
    logger.error(`Erro ao atualizar pedido: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Erro ao atualizar pedido: ${error.message}`,
    });
  }
};
