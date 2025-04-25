import express from 'express';
import {
  addFavorite,
  getAllFavorites,
  getFavoritesById,
  removeFavorite,
} from '../controllers/wishlistController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /favorites/add:
 *   post:
 *     summary: Adiciona um único tênis aos favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário que está adicionando o favorito
 *               sneakerId:
 *                 type: string
 *                 description: ID do tênis a ser adicionado aos favoritos
 *     responses:
 *       200:
 *         description: Tênis adicionado aos favoritos com sucesso
 *       500:
 *         description: Erro ao adicionar aos favoritos
 */

// Adicionar um único tênis aos favoritos
router.post('/', authMiddleware, addFavorite);

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Obtém todos os favoritos
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Lista de tênis favoritos do usuário
 *       500:
 *         description: Erro ao buscar favoritos do usuário
 */

// Obter todos os favoritos
router.get('/', getAllFavorites);

/**
 * @swagger
 * /favorites/{id}:
 *   get:
 *     summary: Obtém os favoritos do usuário
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tênis favoritos do usuário
 *       500:
 *         description: Erro ao buscar favoritos do usuário
 */

// Obter os favoritos do usuário
router.get('/:id', authMiddleware, getFavoritesById);

/**
 * @swagger
 * /favorites/remove/{id}:
 *   delete:
 *     summary: Remove um tênis dos favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tênis removido dos favoritos
 *       500:
 *         description: Erro ao remover dos favoritos
 */

// Remover um tênis dos favoritos
router.delete('/:id', authMiddleware, removeFavorite);

export default router;
