import express from 'express';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Gestão de pedidos
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Criar novo pedido
 *     description: Cria um novo pedido a partir do carrinho ativo do usuário. Calcula frete automaticamente e gera número do pedido único.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - shippingMethod
 *             properties:
 *               shippingAddress:
 *                 type: string
 *                 description: ID do endereço de entrega
 *                 example: "64a1234567890abcdef12345"
 *               shippingMethod:
 *                 type: string
 *                 enum: [normal, express]
 *                 description: Método de entrega escolhido
 *                 example: "express"
 *               preferenceId:
 *                 type: string
 *                 description: ID da preferência de pagamento (Mercado Pago)
 *                 example: "123456789-abcd-efgh-ijkl-123456789012"
 *           examples:
 *             pedido_express:
 *               summary: Pedido com entrega expressa
 *               value:
 *                 shippingAddress: "64a1234567890abcdef12345"
 *                 shippingMethod: "express"
 *                 preferenceId: "123456789-abcd-efgh-ijkl-123456789012"
 *             pedido_normal:
 *               summary: Pedido com entrega normal
 *               value:
 *                 shippingAddress: "64a1234567890abcdef12345"
 *                 shippingMethod: "normal"
 *                 preferenceId: "123456789-abcd-efgh-ijkl-123456789012"
 *             sem_pagamento:
 *               summary: Pedido sem preference ID
 *               value:
 *                 shippingAddress: "64a1234567890abcdef12345"
 *                 shippingMethod: "normal"
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pedido criado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: ID único do pedido
 *                       example: "64a1234567890abcdef12350"
 *                     orderNumber:
 *                       type: string
 *                       description: Número do pedido gerado automaticamente
 *                       example: "P995200001"
 *                     total:
 *                       type: number
 *                       description: Valor total do pedido (subtotal + frete)
 *                       example: 329.89
 *             examples:
 *               pedido_criado:
 *                 summary: Pedido criado com sucesso
 *                 value:
 *                   success: true
 *                   message: "Pedido criado com sucesso"
 *                   data:
 *                     orderId: "64a1234567890abcdef12350"
 *                     orderNumber: "P995200001"
 *                     total: 329.89
 *               pedido_frete_gratis:
 *                 summary: Pedido com frete grátis (>= R$ 300)
 *                 value:
 *                   success: true
 *                   message: "Pedido criado com sucesso"
 *                   data:
 *                     orderId: "64a1234567890abcdef12351"
 *                     orderNumber: "P995200002"
 *                     total: 599.98
 *       400:
 *         description: Carrinho vazio ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Carrinho vazio. Não é possível criar o pedido."
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /orders/user:
 *   get:
 *     summary: Listar pedidos do usuário
 *     description: Retorna todos os pedidos do usuário autenticado com paginação, filtros e ordenação
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Quantidade de itens por página
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, processing, shipped, delivered, cancelled]
 *           default: all
 *         description: Filtrar por status do pedido
 *         example: "delivered"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, total, orderNumber]
 *           default: createdAt
 *         description: Campo para ordenação
 *         example: "createdAt"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da ordenação
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Lista de pedidos obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a1234567890abcdef12350"
 *                       orderNumber:
 *                         type: string
 *                         example: "P995200001"
 *                       status:
 *                         type: string
 *                         enum: [pending, processing, shipped, delivered, cancelled]
 *                         example: "delivered"
 *                       paymentStatus:
 *                         type: string
 *                         enum: [pending, paid, failed, refunded]
 *                         example: "paid"
 *                       total:
 *                         type: number
 *                         example: 329.89
 *                       subtotal:
 *                         type: number
 *                         example: 299.99
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             sneaker:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                   example: "64a1234567890abcdef12347"
 *                                 name:
 *                                   type: string
 *                                   example: "Nike Air Max 90"
 *                                 brand:
 *                                   type: string
 *                                   example: "Nike"
 *                             name:
 *                               type: string
 *                               example: "Nike Air Max 90"
 *                             price:
 *                               type: number
 *                               example: 299.99
 *                             quantity:
 *                               type: number
 *                               example: 1
 *                             size:
 *                               type: string
 *                               example: "42"
 *                             color:
 *                               type: string
 *                               example: "Preto"
 *                       shipping:
 *                         type: object
 *                         properties:
 *                           method:
 *                             type: string
 *                             example: "express"
 *                           cost:
 *                             type: number
 *                             example: 29.90
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "all"
 *                     sortBy:
 *                       type: string
 *                       example: "createdAt"
 *                     sortOrder:
 *                       type: string
 *                       example: "desc"
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Obter detalhes do pedido
 *     description: Retorna os detalhes completos de um pedido específico do usuário autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: ID do pedido
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12350"
 *     responses:
 *       200:
 *         description: Detalhes do pedido obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a1234567890abcdef12350"
 *                     user:
 *                       type: string
 *                       example: "64a1234567890abcdef12340"
 *                     orderNumber:
 *                       type: string
 *                       example: "P995200001"
 *                     status:
 *                       type: string
 *                       example: "delivered"
 *                     paymentStatus:
 *                       type: string
 *                       example: "paid"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sneaker:
 *                             type: object
 *                             description: Dados completos do sneaker
 *                           variant:
 *                             type: object
 *                             description: Dados da variante
 *                           name:
 *                             type: string
 *                             example: "Nike Air Max 90"
 *                           price:
 *                             type: number
 *                             example: 299.99
 *                           quantity:
 *                             type: number
 *                             example: 1
 *                           size:
 *                             type: string
 *                             example: "42"
 *                           color:
 *                             type: string
 *                             example: "Preto"
 *                           image:
 *                             type: string
 *                             example: "https://example.com/nike-air-max-90.jpg"
 *                     subtotal:
 *                       type: number
 *                       example: 299.99
 *                     shipping:
 *                       type: object
 *                       properties:
 *                         method:
 *                           type: string
 *                           example: "express"
 *                         cost:
 *                           type: number
 *                           example: 29.90
 *                         address:
 *                           type: object
 *                           description: Endereço de entrega populado
 *                     total:
 *                       type: number
 *                       example: 329.89
 *                     preferenceId:
 *                       type: string
 *                       example: "123456789-abcd-efgh-ijkl-123456789012"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T15:45:00.000Z"
 *       400:
 *         description: ID de pedido inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID de pedido inválido"
 *       401:
 *         description: Não autorizado a visualizar este pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Não autorizado a visualizar este pedido"
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Pedido não encontrado"
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Atualizar status do pedido
 *     description: Permite ao usuário cancelar um pedido que ainda está em status 'pending' ou 'processing'
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: ID do pedido a ser atualizado
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12350"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [cancelled]
 *                 description: Novo status do pedido (apenas 'cancelled' é permitido pelo cliente)
 *                 example: "cancelled"
 *               cancellationReason:
 *                 type: string
 *                 description: Motivo do cancelamento (opcional)
 *                 example: "Mudança de ideia"
 *           examples:
 *             cancelar_com_motivo:
 *               summary: Cancelar pedido com motivo
 *               value:
 *                 status: "cancelled"
 *                 cancellationReason: "Encontrei uma opção melhor"
 *             cancelar_sem_motivo:
 *               summary: Cancelar pedido sem motivo específico
 *               value:
 *                 status: "cancelled"
 *     responses:
 *       200:
 *         description: Pedido cancelado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pedido cancelado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a1234567890abcdef12350"
 *                     orderNumber:
 *                       type: string
 *                       example: "P995200001"
 *                     status:
 *                       type: string
 *                       example: "cancelled"
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:30:00.000Z"
 *                     cancellationReason:
 *                       type: string
 *                       example: "Encontrei uma opção melhor"
 *       400:
 *         description: Operação não permitida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "ID de pedido inválido"
 *                     - "Este pedido não pode mais ser cancelado"
 *                     - "Operação de atualização não permitida"
 *       401:
 *         description: Não autorizado a modificar este pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Não autorizado a modificar este pedido"
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Pedido não encontrado"
 *       500:
 *         description: Erro interno do servidor
 */

router.post('/', createOrder);

router.get('/user', getUserOrders);

router.get('/:orderId', getOrderById);

router.patch('/:orderId/status', updateOrderStatus);

export default router;
