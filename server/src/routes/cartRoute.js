import express from 'express';
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateItemQuantity,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Gestão do carrinho de compras
 */

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Obter carrinho do usuário
 *     description: Retorna o carrinho ativo do usuário autenticado com todos os itens e informações populadas
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrinho obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 cart:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a1234567890abcdef12345"
 *                     user:
 *                       type: string
 *                       example: "64a1234567890abcdef12340"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64a1234567890abcdef12346"
 *                           sneaker:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "64a1234567890abcdef12347"
 *                               name:
 *                                 type: string
 *                                 example: "Nike Air Max 90"
 *                               brand:
 *                                 type: string
 *                                 example: "Nike"
 *                               slug:
 *                                 type: string
 *                                 example: "nike-air-max-90"
 *                               finalPrice:
 *                                 type: number
 *                                 example: 299.99
 *                           variant:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "64a1234567890abcdef12348"
 *                               size:
 *                                 type: string
 *                                 example: "42"
 *                               color:
 *                                 type: string
 *                                 example: "Preto"
 *                               price:
 *                                 type: number
 *                                 example: 299.99
 *                               stock:
 *                                 type: number
 *                                 example: 5
 *                           quantity:
 *                             type: number
 *                             example: 2
 *                           price:
 *                             type: number
 *                             example: 299.99
 *                           name:
 *                             type: string
 *                             example: "Nike Air Max 90"
 *                           size:
 *                             type: string
 *                             example: "42"
 *                           color:
 *                             type: string
 *                             example: "Preto"
 *                           brand:
 *                             type: string
 *                             example: "Nike"
 *                           image:
 *                             type: string
 *                             example: "https://example.com/nike-air-max-90.jpg"
 *                           cartItemId:
 *                             type: string
 *                             example: "64a1234567890abcdef12347-42-Preto-1640995200000"
 *                     totalItems:
 *                       type: number
 *                       example: 2
 *                     totalPrice:
 *                       type: number
 *                       example: 599.98
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *             examples:
 *               carrinho_com_itens:
 *                 summary: Carrinho com itens
 *                 value:
 *                   success: true
 *                   cart:
 *                     _id: "64a1234567890abcdef12345"
 *                     user: "64a1234567890abcdef12340"
 *                     status: "active"
 *                     items: []
 *                     totalItems: 2
 *                     totalPrice: 599.98
 *               carrinho_vazio:
 *                 summary: Carrinho vazio
 *                 value:
 *                   success: true
 *                   message: "Carrinho não encontrado"
 *                   cart:
 *                     items: []
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Adicionar item ao carrinho
 *     description: Adiciona um produto ao carrinho do usuário. Verifica estoque disponível e cria carrinho se não existir.
 *     tags: [Cart]
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
 *               - variantId
 *               - quantity
 *             properties:
 *               sneakerId:
 *                 type: string
 *                 description: ID do tênis
 *                 example: "64a1234567890abcdef12347"
 *               variantId:
 *                 type: string
 *                 description: ID da variante (tamanho/cor)
 *                 example: "64a1234567890abcdef12348"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantidade do produto
 *                 example: 2
 *               color:
 *                 type: string
 *                 description: Cor do produto
 *                 example: "Preto"
 *               size:
 *                 type: string
 *                 description: Tamanho do produto
 *                 example: "42"
 *               image:
 *                 type: string
 *                 description: URL da imagem do produto
 *                 example: "https://example.com/nike-air-max-90.jpg"
 *               name:
 *                 type: string
 *                 description: Nome do produto
 *                 example: "Nike Air Max 90"
 *               price:
 *                 type: number
 *                 description: Preço do produto
 *                 example: 299.99
 *               originalPrice:
 *                 type: number
 *                 description: Preço original (sem desconto)
 *                 example: 399.99
 *               brand:
 *                 type: string
 *                 description: Marca do produto
 *                 example: "Nike"
 *               slug:
 *                 type: string
 *                 description: Slug do produto
 *                 example: "nike-air-max-90"
 *               cartItemId:
 *                 type: string
 *                 description: ID único do item no carrinho (opcional)
 *                 example: "64a1234567890abcdef12347-42-Preto-1640995200000"
 *           examples:
 *             adicionar_tenis:
 *               summary: Adicionar tênis ao carrinho
 *               value:
 *                 sneakerId: "64a1234567890abcdef12347"
 *                 variantId: "64a1234567890abcdef12348"
 *                 quantity: 1
 *     responses:
 *       200:
 *         description: Item adicionado ao carrinho com sucesso
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
 *                   example: "Item adicionado ao carrinho"
 *                 data:
 *                   type: object
 *                   description: Carrinho atualizado
 *       400:
 *         description: Dados inválidos ou estoque insuficiente
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
 *                     - "Quantidade deve ser um número inteiro maior que zero"
 *                     - "sneakerId e variantId são obrigatórios"
 *                     - "Quantidade solicitada não disponível em estoque"
 *                 availableStock:
 *                   type: number
 *                   example: 3
 *       404:
 *         description: Produto ou variante não encontrado
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
 *                     - "Tênis não encontrado"
 *                     - "Variante não encontrada"
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /carts:
 *   delete:
 *     summary: Limpar carrinho
 *     description: Remove todos os itens do carrinho do usuário
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrinho limpo com sucesso
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
 *                   examples:
 *                     - "Carrinho limpo com sucesso"
 *                     - "Carrinho já estava vazio"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a1234567890abcdef12345"
 *                     user:
 *                       type: string
 *                       example: "64a1234567890abcdef12340"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     items:
 *                       type: array
 *                       items: {}
 *                       example: []
 *                     totalItems:
 *                       type: number
 *                       example: 0
 *                     totalPrice:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /carts/{cartItemId}:
 *   patch:
 *     summary: Atualizar quantidade do item
 *     description: Atualiza a quantidade de um item específico no carrinho. Verifica disponibilidade em estoque.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         description: ID único do item no carrinho
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12347-42-Preto-1640995200000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Nova quantidade do item
 *                 example: 3
 *           examples:
 *             aumentar_quantidade:
 *               summary: Aumentar quantidade
 *               value:
 *                 quantity: 5
 *             diminuir_quantidade:
 *               summary: Diminuir quantidade
 *               value:
 *                 quantity: 1
 *     responses:
 *       200:
 *         description: Quantidade atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 cart:
 *                   type: object
 *                   description: Carrinho atualizado com populações
 *       400:
 *         description: Quantidade inválida ou estoque insuficiente
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
 *                   example: "Quantidade solicitada não disponível em estoque"
 *                 availableStock:
 *                   type: number
 *                   example: 2
 *       404:
 *         description: Carrinho ou item não encontrado
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
 *                     - "Carrinho não encontrado"
 *                     - "Item não encontrado no carrinho"
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /carts/{cartItemId}:
 *   delete:
 *     summary: Remover item do carrinho
 *     description: Remove um item específico do carrinho do usuário
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         description: ID único do item no carrinho
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12347-42-Preto-1640995200000"
 *     responses:
 *       200:
 *         description: Item removido com sucesso
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
 *                   examples:
 *                     - "Item removido do carrinho"
 *                     - "Carrinho esvaziado"
 *                 cart:
 *                   type: object
 *                   description: Carrinho atualizado (pode estar vazio)
 *             examples:
 *               item_removido:
 *                 summary: Item removido - carrinho ainda tem itens
 *                 value:
 *                   success: true
 *                   message: "Item removido do carrinho"
 *                   cart:
 *                     _id: "64a1234567890abcdef12345"
 *                     items: []
 *               carrinho_esvaziado:
 *                 summary: Último item removido
 *                 value:
 *                   success: true
 *                   message: "Carrinho esvaziado"
 *                   cart:
 *                     _id: "64a1234567890abcdef12345"
 *                     items: []
 *                     totalItems: 0
 *                     totalPrice: 0
 *       404:
 *         description: Carrinho ou item não encontrado
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
 *                     - "Carrinho ativo não encontrado"
 *                     - "Item não encontrado no carrinho"
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/:cartItemId').patch(updateItemQuantity).delete(removeFromCart);

export default router;
