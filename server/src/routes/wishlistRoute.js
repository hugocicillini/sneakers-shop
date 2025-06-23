import express from 'express';
import {
  addToWishlist,
  clearWishlist,
  getUserWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Wishlist
 *     description: Gestão de lista de desejos
 */

/**
 * @swagger
 * /wishlists:
 *   get:
 *     summary: Obter wishlist do usuário
 *     description: Retorna a lista de desejos do usuário autenticado com informações completas dos tênis incluindo variantes e marca
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist recuperada com sucesso
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
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     user:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     sneakers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sneaker:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                               name:
 *                                 type: string
 *                                 example: "Nike Air Jordan 1 Retro High"
 *                               slug:
 *                                 type: string
 *                                 example: "nike-air-jordan-1-retro-high"
 *                               basePrice:
 *                                 type: number
 *                                 example: 899.99
 *                               finalPrice:
 *                                 type: number
 *                                 example: 809.99
 *                               coverImage:
 *                                 type: object
 *                                 properties:
 *                                   url:
 *                                     type: string
 *                                     example: "https://example.com/jordan1.jpg"
 *                                   alt:
 *                                     type: string
 *                                     example: "Nike Air Jordan 1"
 *                               brand:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     example: "Nike"
 *                               variants:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     _id:
 *                                       type: string
 *                                       example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                                     size:
 *                                       type: number
 *                                       example: 42
 *                                     color:
 *                                       type: string
 *                                       example: "Vermelho"
 *                                     stock:
 *                                       type: number
 *                                       example: 10
 *                                     finalPrice:
 *                                       type: number
 *                                       example: 809.99
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           notes:
 *                             type: string
 *                             example: "Aguardando promoção"
 *                           _id:
 *                             type: string
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *             examples:
 *               wishlist_com_itens:
 *                 summary: Wishlist com itens
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     sneakers:
 *                       - sneaker:
 *                           _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                           name: "Nike Air Jordan 1 Retro High"
 *                           slug: "nike-air-jordan-1-retro-high"
 *                           basePrice: 899.99
 *                           finalPrice: 809.99
 *                           brand:
 *                             name: "Nike"
 *                           variants:
 *                             - size: 42
 *                               color: "Vermelho"
 *                               stock: 10
 *                               finalPrice: 809.99
 *                         addedAt: "2024-01-15T10:30:00.000Z"
 *                         _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               wishlist_vazia:
 *                 summary: Wishlist vazia
 *                 value:
 *                   success: true
 *                   data:
 *                     sneakers: []
 *       401:
 *         description: Token não fornecido ou inválido
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
 *                   example: "Token não fornecido"
 *       500:
 *         description: Erro interno do servidor
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
 *                   example: "Erro interno do servidor"
 */
router.get('/', authMiddleware, getUserWishlist);

/**
 * @swagger
 * /wishlists:
 *   post:
 *     summary: Adicionar tênis à wishlist
 *     description: Adiciona um tênis à lista de desejos do usuário autenticado. Verifica se o tênis existe e está ativo antes de adicionar. Evita duplicatas automaticamente.
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sneakerId
 *             properties:
 *               sneakerId:
 *                 type: string
 *                 description: ID do tênis a ser adicionado à wishlist
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *           examples:
 *             adicionar_tenis:
 *               summary: Adicionar tênis à wishlist
 *               value:
 *                 sneakerId: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Tênis adicionado à wishlist com sucesso
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
 *                   example: "Tênis adicionado à wishlist com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     user:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     sneakers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sneaker:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                               name:
 *                                 type: string
 *                                 example: "Nike Air Jordan 1 Retro High"
 *                               slug:
 *                                 type: string
 *                                 example: "nike-air-jordan-1-retro-high"
 *                               basePrice:
 *                                 type: number
 *                                 example: 899.99
 *                               finalPrice:
 *                                 type: number
 *                                 example: 809.99
 *                               brand:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     example: "Nike"
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           _id:
 *                             type: string
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *             examples:
 *               sucesso:
 *                 summary: Tênis adicionado com sucesso
 *                 value:
 *                   success: true
 *                   message: "Tênis adicionado à wishlist com sucesso"
 *                   data:
 *                     _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     user: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     sneakers:
 *                       - sneaker:
 *                           _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                           name: "Nike Air Jordan 1 Retro High"
 *                           slug: "nike-air-jordan-1-retro-high"
 *                           basePrice: 899.99
 *                           finalPrice: 809.99
 *                           brand:
 *                             name: "Nike"
 *                         addedAt: "2024-01-15T10:30:00.000Z"
 *                         _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       400:
 *         description: Dados inválidos
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
 *                   example: "ID do tênis é obrigatório"
 *       401:
 *         description: Token não fornecido ou inválido
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
 *                   example: "Token não fornecido"
 *       404:
 *         description: Tênis não encontrado
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
 *                   example: "Tênis não encontrado ou não está disponível"
 *       409:
 *         description: Tênis já está na wishlist
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
 *                   example: "Tênis já está na sua lista de desejos"
 *       500:
 *         description: Erro interno do servidor
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
 *                   example: "Erro interno do servidor"
 */
router.post('/', authMiddleware, addToWishlist);

/**
 * @swagger
 * /wishlists/{sneakerId}:
 *   delete:
 *     summary: Remover tênis da wishlist
 *     description: Remove um tênis específico da lista de desejos do usuário autenticado
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sneakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tênis a ser removido da wishlist
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Tênis removido da wishlist com sucesso
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
 *                   example: "Tênis removido da wishlist com sucesso"
 *             examples:
 *               sucesso:
 *                 summary: Remoção bem-sucedida
 *                 value:
 *                   success: true
 *                   message: "Tênis removido da wishlist com sucesso"
 *       401:
 *         description: Token não fornecido ou inválido
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
 *                   example: "Token não fornecido"
 *       404:
 *         description: Wishlist ou tênis não encontrado
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
 *             examples:
 *               wishlist_nao_encontrada:
 *                 summary: Wishlist não encontrada
 *                 value:
 *                   success: false
 *                   message: "Wishlist não encontrada"
 *               tenis_nao_encontrado:
 *                 summary: Tênis não está na wishlist
 *                 value:
 *                   success: false
 *                   message: "Tênis não encontrado na wishlist"
 *       500:
 *         description: Erro interno do servidor
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
 *                   example: "Erro interno do servidor"
 */
router.delete('/:sneakerId', authMiddleware, removeFromWishlist);

/**
 * @swagger
 * /wishlists:
 *   delete:
 *     summary: Limpar wishlist
 *     description: Remove todos os tênis da lista de desejos do usuário autenticado
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist esvaziada com sucesso
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
 *                   example: "Wishlist esvaziada com sucesso"
 *             examples:
 *               sucesso:
 *                 summary: Wishlist limpa com sucesso
 *                 value:
 *                   success: true
 *                   message: "Wishlist esvaziada com sucesso"
 *       401:
 *         description: Token não fornecido ou inválido
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
 *                   example: "Token não fornecido"
 *       404:
 *         description: Wishlist não encontrada
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
 *                   example: "Wishlist não encontrada"
 *       500:
 *         description: Erro interno do servidor
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
 *                   example: "Erro interno do servidor"
 */
router.delete('/', authMiddleware, clearWishlist);

export default router;