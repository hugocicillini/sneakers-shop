import express from 'express';
import {
  createReview,
  deleteReview,
  getSneakerReviewPreview,
  getSneakerReviews,
  updateReview,
} from '../controllers/reviewController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Sistema de avaliações de produtos
 */

/**
 * @swagger
 * /reviews/sneaker/{sneakerId}/preview:
 *   get:
 *     summary: Preview das avaliações do tênis
 *     description: Retorna estatísticas e algumas avaliações em destaque de um tênis específico
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: sneakerId
 *         required: true
 *         description: ID do tênis
 *         schema:
 *           type: string
 *           example: "669092b66202503a8d1d5b82"
 *     responses:
 *       200:
 *         description: Preview das avaliações obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       description: Total de avaliações
 *                       example: 128
 *                     avgRating:
 *                       type: number
 *                       description: Nota média (arredondada)
 *                       example: 4.3
 *                     ratingBreakdown:
 *                       type: object
 *                       description: Quantidade por nota
 *                       properties:
 *                         "1":
 *                           type: integer
 *                           example: 2
 *                         "2":
 *                           type: integer
 *                           example: 5
 *                         "3":
 *                           type: integer
 *                           example: 12
 *                         "4":
 *                           type: integer
 *                           example: 45
 *                         "5":
 *                           type: integer
 *                           example: 64
 *                     ratingPercentages:
 *                       type: object
 *                       description: Percentual por nota
 *                       properties:
 *                         "1":
 *                           type: integer
 *                           example: 2
 *                         "2":
 *                           type: integer
 *                           example: 4
 *                         "3":
 *                           type: integer
 *                           example: 9
 *                         "4":
 *                           type: integer
 *                           example: 35
 *                         "5":
 *                           type: integer
 *                           example: 50
 *                 featuredReviews:
 *                   type: array
 *                   description: Até 5 avaliações em destaque (melhores notas primeiro)
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a1234567890abcdef12350"
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64a1234567890abcdef12340"
 *                           name:
 *                             type: string
 *                             example: "João Silva"
 *                           avatar:
 *                             type: string
 *                             example: "https://example.com/avatar.jpg"
 *                       rating:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 5
 *                         example: 5
 *                       comment:
 *                         type: string
 *                         example: "Excelente tênis! Muito confortável e bonito."
 *                       isVerified:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                 hasMore:
 *                   type: boolean
 *                   description: Se existem mais avaliações além das 5 mostradas
 *                   example: true
 *             examples:
 *               produto_bem_avaliado:
 *                 summary: Produto com muitas avaliações positivas
 *                 value:
 *                   success: true
 *                   stats:
 *                     totalCount: 128
 *                     avgRating: 4.3
 *                     ratingBreakdown:
 *                       "1": 2
 *                       "2": 5
 *                       "3": 12
 *                       "4": 45
 *                       "5": 64
 *                     ratingPercentages:
 *                       "1": 2
 *                       "2": 4
 *                       "3": 9
 *                       "4": 35
 *                       "5": 50
 *                   featuredReviews: []
 *                   hasMore: true
 *               produto_sem_avaliacoes:
 *                 summary: Produto sem avaliações
 *                 value:
 *                   success: true
 *                   stats:
 *                     totalCount: 0
 *                     avgRating: 0
 *                     ratingBreakdown:
 *                       "1": 0
 *                       "2": 0
 *                       "3": 0
 *                       "4": 0
 *                       "5": 0
 *                     ratingPercentages:
 *                       "1": 0
 *                       "2": 0
 *                       "3": 0
 *                       "4": 0
 *                       "5": 0
 *                   featuredReviews: []
 *                   hasMore: false
 *       400:
 *         description: ID de tênis inválido
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
 *                   example: "ID de tênis inválido"
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
 *                   example: "Tênis não encontrado"
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /reviews/sneaker/{sneakerId}:
 *   get:
 *     summary: Listar avaliações do tênis
 *     description: Retorna todas as avaliações de um tênis com paginação e filtros de ordenação
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: sneakerId
 *         required: true
 *         description: ID do tênis
 *         schema:
 *           type: string
 *           example: "669092b66202503a8d1d5b82"
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
 *         description: Quantidade de avaliações por página
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, highest, lowest]
 *           default: recent
 *         description: Ordenação das avaliações
 *         example: "recent"
 *     responses:
 *       200:
 *         description: Lista de avaliações obtida com sucesso
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
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64a1234567890abcdef12340"
 *                           name:
 *                             type: string
 *                             example: "João Silva"
 *                       sneaker:
 *                         type: string
 *                         example: "669092b66202503a8d1d5b82"
 *                       rating:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 5
 *                         example: 4
 *                       comment:
 *                         type: string
 *                         example: "Tênis muito confortável, recomendo!"
 *                       isVerified:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                 page:
 *                   type: integer
 *                   description: Página atual
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   description: Total de páginas
 *                   example: 13
 *                 total:
 *                   type: integer
 *                   description: Total de avaliações
 *                   example: 128
 *                 stats:
 *                   type: object
 *                   description: Estatísticas das avaliações por nota
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     "1": 2
 *                     "2": 5
 *                     "3": 12
 *                     "4": 45
 *                     "5": 64
 *                 averageRating:
 *                   type: number
 *                   description: Nota média do produto
 *                   example: 4.3
 *             examples:
 *               ordenacao_recente:
 *                 summary: Avaliações mais recentes primeiro
 *                 value:
 *                   success: true
 *                   data: []
 *                   page: 1
 *                   pages: 13
 *                   total: 128
 *                   stats:
 *                     "5": 64
 *                     "4": 45
 *                     "3": 12
 *                     "2": 5
 *                     "1": 2
 *                   averageRating: 4.3
 *               ordenacao_maior_nota:
 *                 summary: Maiores notas primeiro
 *                 value:
 *                   success: true
 *                   data: []
 *                   page: 1
 *                   pages: 13
 *                   total: 128
 *       400:
 *         description: ID de tênis inválido
 *       404:
 *         description: Tênis não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Criar nova avaliação
 *     description: Permite ao usuário autenticado criar uma avaliação para um tênis (uma avaliação por produto por usuário)
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               sneakerId:
 *                 type: string
 *                 description: ID do tênis a ser avaliado
 *                 example: "669092b66202503a8d1d5b82"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Nota de 1 a 5 estrelas
 *                 example: 4
 *               comment:
 *                 type: string
 *                 description: Comentário da avaliação (opcional)
 *                 maxLength: 500
 *                 example: "Tênis muito confortável e com ótimo acabamento. Recomendo!"
 *           examples:
 *             avaliacao_completa:
 *               summary: Avaliação com comentário
 *               value:
 *                 sneakerId: "669092b66202503a8d1d5b82"
 *                 rating: 5
 *                 comment: "Excelente produto! Superou minhas expectativas."
 *             avaliacao_simples:
 *               summary: Apenas nota, sem comentário
 *               value:
 *                 sneakerId: "669092b66202503a8d1d5b82"
 *                 rating: 4
 *             avaliacao_negativa:
 *               summary: Avaliação com nota baixa
 *               value:
 *                 sneakerId: "669092b66202503a8d1d5b82"
 *                 rating: 2
 *                 comment: "Não gostei do acabamento. Esperava mais qualidade."
 *     responses:
 *       201:
 *         description: Avaliação criada com sucesso
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
 *                     sneaker:
 *                       type: string
 *                       example: "669092b66202503a8d1d5b82"
 *                     rating:
 *                       type: integer
 *                       example: 4
 *                     comment:
 *                       type: string
 *                       example: "Tênis muito confortável e com ótimo acabamento."
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Dados inválidos ou produto já avaliado
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
 *                     - "ID de produto inválido: 669092b66202503a8d1d5b82"
 *                     - "Rating deve ser um número entre 1 e 5"
 *                     - "Produto já foi avaliado por você"
 *       404:
 *         description: Produto não encontrado
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
 *                   example: "Produto não encontrado com o ID: 669092b66202503a8d1d5b82"
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Atualizar avaliação
 *     description: Permite ao usuário editar sua própria avaliação ou admin editar qualquer avaliação
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         description: ID da avaliação a ser atualizada
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12350"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Nova nota (opcional)
 *                 example: 5
 *               comment:
 *                 type: string
 *                 description: Novo comentário (opcional)
 *                 maxLength: 500
 *                 example: "Atualização: Após usar mais tempo, confirmo que é excelente!"
 *           examples:
 *             atualizar_nota:
 *               summary: Atualizar apenas a nota
 *               value:
 *                 rating: 5
 *             atualizar_comentario:
 *               summary: Atualizar apenas o comentário
 *               value:
 *                 comment: "Correção: Produto muito bom, mudei de opinião!"
 *             atualizar_completo:
 *               summary: Atualizar nota e comentário
 *               value:
 *                 rating: 5
 *                 comment: "Após usar por mais tempo, confirmo que é excelente!"
 *     responses:
 *       200:
 *         description: Avaliação atualizada com sucesso
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
 *                     sneaker:
 *                       type: string
 *                       example: "669092b66202503a8d1d5b82"
 *                     rating:
 *                       type: integer
 *                       example: 5
 *                     comment:
 *                       type: string
 *                       example: "Após usar por mais tempo, confirmo que é excelente!"
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T11:45:00.000Z"
 *       400:
 *         description: ID de review inválido
 *       401:
 *         description: Não autorizado ou token inválido
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
 *                   example: "Não autorizado"
 *       404:
 *         description: Review não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Deletar avaliação
 *     description: Permite ao usuário deletar sua própria avaliação ou admin deletar qualquer avaliação
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         description: ID da avaliação a ser deletada
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12350"
 *     responses:
 *       200:
 *         description: Avaliação removida com sucesso
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
 *                   example: "Review removida com sucesso"
 *       400:
 *         description: ID de review inválido
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
 *                   example: "ID de review inválido"
 *       401:
 *         description: Não autorizado
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
 *                   example: "Não autorizado"
 *       404:
 *         description: Review não encontrado
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
 *                   example: "Review não encontrada"
 *       500:
 *         description: Erro interno do servidor
 */

router.get('/sneaker/:sneakerId/preview', getSneakerReviewPreview);
router.get('/sneaker/:sneakerId', getSneakerReviews);

router.post('/', authMiddleware, createReview);
router.put('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);

export default router;