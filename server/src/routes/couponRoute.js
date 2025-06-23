import express from 'express';
import { validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Coupons
 *     description: Sistema de cupons de desconto
 */

/**
 * @swagger
 * /coupons/code/{code}/validate:
 *   post:
 *     summary: Validar cupom de desconto
 *     description: Valida um cupom de desconto e calcula o valor do desconto aplicado ao carrinho. Verifica todas as regras de negócio como validade, limite de uso, valor mínimo, tipo de usuário e produtos aplicáveis.
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Código do cupom a ser validado (case insensitive)
 *         schema:
 *           type: string
 *           example: "DESCONTO10"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartTotal
 *             properties:
 *               cartTotal:
 *                 type: number
 *                 description: Valor total do carrinho
 *                 example: 299.99
 *               cartItems:
 *                 type: array
 *                 description: Itens do carrinho para validação de produtos específicos
 *                 items:
 *                   type: object
 *                   properties:
 *                     sneakerId:
 *                       type: string
 *                       example: "64a1234567890abcdef12347"
 *                     categoryId:
 *                       type: string
 *                       example: "64a1234567890abcdef12349"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     price:
 *                       type: number
 *                       example: 149.99
 *           examples:
 *             validacao_basica:
 *               summary: Validação básica do cupom
 *               value:
 *                 cartTotal: 299.99
 *             validacao_com_itens:
 *               summary: Validação com itens específicos
 *               value:
 *                 cartTotal: 599.98
 *                 cartItems:
 *                   - sneakerId: "64a1234567890abcdef12347"
 *                     categoryId: "64a1234567890abcdef12349"
 *                     quantity: 2
 *                     price: 299.99
 *             carrinho_grande:
 *               summary: Carrinho com valor alto
 *               value:
 *                 cartTotal: 1299.99
 *                 cartItems:
 *                   - sneakerId: "64a1234567890abcdef12347"
 *                     quantity: 1
 *                     price: 699.99
 *                   - sneakerId: "64a1234567890abcdef12350"
 *                     quantity: 2
 *                     price: 299.99
 *     responses:
 *       200:
 *         description: Cupom válido e desconto calculado
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
 *                     code:
 *                       type: string
 *                       description: Código do cupom
 *                       example: "DESCONTO10"
 *                     description:
 *                       type: string
 *                       description: Descrição do cupom
 *                       example: "10% de desconto em toda loja"
 *                     discountType:
 *                       type: string
 *                       enum: [percentage, fixed]
 *                       description: Tipo de desconto
 *                       example: "percentage"
 *                     discountValue:
 *                       type: number
 *                       description: Valor ou percentual do desconto
 *                       example: 10
 *                     discountAmount:
 *                       type: number
 *                       description: Valor em reais do desconto aplicado
 *                       example: 29.99
 *                     totalAfterDiscount:
 *                       type: number
 *                       description: Total após aplicar o desconto
 *                       example: 270.00
 *                     canBeCombined:
 *                       type: boolean
 *                       description: Se o cupom pode ser combinado com outros
 *                       example: true
 *             examples:
 *               desconto_percentual:
 *                 summary: Desconto percentual
 *                 value:
 *                   success: true
 *                   data:
 *                     code: "DESCONTO10"
 *                     description: "10% de desconto em toda loja"
 *                     discountType: "percentage"
 *                     discountValue: 10
 *                     discountAmount: 29.99
 *                     totalAfterDiscount: 270.00
 *                     canBeCombined: true
 *               desconto_fixo:
 *                 summary: Desconto valor fixo
 *                 value:
 *                   success: true
 *                   data:
 *                     code: "FRETE50"
 *                     description: "R$ 50 de desconto"
 *                     discountType: "fixed"
 *                     discountValue: 50
 *                     discountAmount: 50.00
 *                     totalAfterDiscount: 249.99
 *                     canBeCombined: false
 *               desconto_primeira_compra:
 *                 summary: Cupom para novos clientes
 *                 value:
 *                   success: true
 *                   data:
 *                     code: "BEMVINDO20"
 *                     description: "20% de desconto para novos clientes"
 *                     discountType: "percentage"
 *                     discountValue: 20
 *                     discountAmount: 59.99
 *                     totalAfterDiscount: 240.00
 *                     canBeCombined: false
 *       400:
 *         description: Cupom inválido ou não aplicável
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
 *                   description: Motivo da invalidação
 *                 minimumPurchase:
 *                   type: number
 *                   description: Valor mínimo necessário (quando aplicável)
 *             examples:
 *               dados_obrigatorios:
 *                 summary: Dados obrigatórios não fornecidos
 *                 value:
 *                   success: false
 *                   message: "Código de cupom e valor do carrinho são obrigatórios"
 *               fora_validade:
 *                 summary: Cupom fora do período de validade
 *                 value:
 *                   success: false
 *                   message: "Cupom fora do período de validade"
 *               limite_uso:
 *                 summary: Limite de uso atingido
 *                 value:
 *                   success: false
 *                   message: "Cupom atingiu o limite máximo de usos"
 *               valor_minimo:
 *                 summary: Valor mínimo não atingido
 *                 value:
 *                   success: false
 *                   message: "Valor mínimo para este cupom: R$ 500.00"
 *                   minimumPurchase: 500.00
 *               limite_usuario:
 *                 summary: Usuário já usou o limite permitido
 *                 value:
 *                   success: false
 *                   message: "Você já atingiu o limite de uso deste cupom"
 *               novo_cliente:
 *                 summary: Cupom apenas para novos clientes
 *                 value:
 *                   success: false
 *                   message: "Este cupom é válido apenas para novos clientes"
 *               cliente_recorrente:
 *                 summary: Cupom apenas para clientes recorrentes
 *                 value:
 *                   success: false
 *                   message: "Este cupom é válido apenas para clientes recorrentes"
 *               cliente_vip:
 *                 summary: Cupom exclusivo VIP
 *                 value:
 *                   success: false
 *                   message: "Este cupom é exclusivo para clientes VIP"
 *               produtos_especificos:
 *                 summary: Cupom não aplicável aos produtos do carrinho
 *                 value:
 *                   success: false
 *                   message: "Este cupom não é aplicável aos produtos selecionados"
 *       404:
 *         description: Cupom não encontrado
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
 *                   example: "Cupom não encontrado ou inválido"
 *             examples:
 *               cupom_nao_encontrado:
 *                 summary: Cupom não existe
 *                 value:
 *                   success: false
 *                   message: "Cupom não encontrado ou inválido"
 *               cupom_inativo:
 *                 summary: Cupom desativado
 *                 value:
 *                   success: false
 *                   message: "Cupom não encontrado ou inválido"
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

router.post('/code/:code/validate', validateCoupon);

export default router;
