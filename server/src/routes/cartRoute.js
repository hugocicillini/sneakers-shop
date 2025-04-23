import express from 'express';
import {
  addToCart,
  getCart,
  removeFromCart,
} from '../controllers/cartController.js';
import optionalAuth from '../middlewares/optionalAuth.js';

const router = express.Router();

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Adiciona um item ao carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sneakerId:
 *                 type: string
 *                 description: ID do tênis a ser adicionado
 *               quantity:
 *                 type: number
 *                 description: Quantidade do tênis
 *     responses:
 *       200:
 *         description: Item adicionado ao carrinho com sucesso
 *       400:
 *         description: Requisição inválida
 *       500:
 *         description: Erro interno do servidor
 */

// Adicionar item ao carrinho
router.post('/add', optionalAuth, addToCart);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Obtém os itens do carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de itens no carrinho
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sneaker:
 *                         type: string
 *                         description: ID do tênis
 *                       quantity:
 *                         type: number
 *                         description: Quantidade do tênis
 *       500:
 *         description: Erro interno do servidor
 */

// Obter itens do carrinho
router.get('/', optionalAuth, getCart);

/**
 * @swagger
 * /cart/remove/{id}:
 *   delete:
 *     summary: Remove um item do carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item a ser removido do carrinho
 *     responses:
 *       200:
 *         description: Item removido do carrinho com sucesso
 *       404:
 *         description: Item não encontrado no carrinho
 *       500:
 *         description: Erro interno do servidor
 */

// Remover item do carrinho
router.delete('/remove/:id', optionalAuth, removeFromCart);

export default router;
