import express from 'express';
import {
  createAddress,
  deleteAddress,
  getUserAddresses,
  updateAddress,
} from '../controllers/addressController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Addresses
 *     description: Gestão de endereços do usuário
 */

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Listar endereços do usuário
 *     description: Retorna todos os endereços do usuário autenticado, ordenados por padrão e data de criação
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Endereços obtidos com sucesso
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
 *                         example: "64a1234567890abcdef12345"
 *                       user:
 *                         type: string
 *                         example: "64a1234567890abcdef12340"
 *                       type:
 *                         type: string
 *                         enum: [Residencial, Comercial, Outro]
 *                         example: "Residencial"
 *                       isDefault:
 *                         type: boolean
 *                         example: true
 *                       recipient:
 *                         type: string
 *                         example: "João Silva"
 *                       phoneNumber:
 *                         type: string
 *                         example: "(11) 99999-9999"
 *                       zipCode:
 *                         type: string
 *                         example: "01234-567"
 *                       street:
 *                         type: string
 *                         example: "Rua das Flores"
 *                       number:
 *                         type: string
 *                         example: "123"
 *                       complement:
 *                         type: string
 *                         example: "Apto 45"
 *                       neighborhood:
 *                         type: string
 *                         example: "Centro"
 *                       city:
 *                         type: string
 *                         example: "São Paulo"
 *                       state:
 *                         type: string
 *                         example: "SP"
 *                       reference:
 *                         type: string
 *                         example: "Próximo ao shopping"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-01T00:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Token de acesso inválido
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
 *                   example: "Token de acesso inválido"
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Criar novo endereço
 *     description: Cria um novo endereço para o usuário autenticado. O primeiro endereço criado automaticamente se torna padrão.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipient
 *               - phoneNumber
 *               - zipCode
 *               - street
 *               - number
 *               - neighborhood
 *               - city
 *               - state
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [Residencial, Comercial, Outro]
 *                 example: "Residencial"
 *               isDefault:
 *                 type: boolean
 *                 description: Define como endereço padrão (primeiro endereço é sempre padrão)
 *                 example: false
 *               recipient:
 *                 type: string
 *                 description: Nome do destinatário
 *                 example: "João Silva"
 *               phoneNumber:
 *                 type: string
 *                 description: Telefone para contato na entrega
 *                 example: "(11) 99999-9999"
 *               zipCode:
 *                 type: string
 *                 description: CEP do endereço
 *                 example: "01234-567"
 *               street:
 *                 type: string
 *                 description: Nome da rua
 *                 example: "Rua das Flores"
 *               number:
 *                 type: string
 *                 description: Número do endereço
 *                 example: "123"
 *               complement:
 *                 type: string
 *                 description: Complemento (opcional)
 *                 example: "Apto 45"
 *               neighborhood:
 *                 type: string
 *                 description: Bairro
 *                 example: "Centro"
 *               city:
 *                 type: string
 *                 description: Cidade
 *                 example: "São Paulo"
 *               state:
 *                 type: string
 *                 description: Estado (sigla)
 *                 example: "SP"
 *               reference:
 *                 type: string
 *                 description: Ponto de referência (opcional)
 *                 example: "Próximo ao shopping"
 *           examples:
 *             endereco_casa:
 *               summary: Endereço residencial
 *               value:
 *                 type: "Residencial"
 *                 recipient: "João Silva"
 *                 phoneNumber: "(11) 99999-9999"
 *                 zipCode: "01234-567"
 *                 street: "Rua das Flores"
 *                 number: "123"
 *                 complement: "Apto 45"
 *                 neighborhood: "Centro"
 *                 city: "São Paulo"
 *                 state: "SP"
 *                 reference: "Próximo ao shopping"
 *             endereco_trabalho:
 *               summary: Endereço comercial
 *               value:
 *                 type: "Comercial"
 *                 recipient: "João Silva"
 *                 phoneNumber: "(11) 88888-8888"
 *                 zipCode: "04567-890"
 *                 street: "Av. Paulista"
 *                 number: "1000"
 *                 complement: "Sala 501"
 *                 neighborhood: "Bela Vista"
 *                 city: "São Paulo"
 *                 state: "SP"
 *                 reference: "Edifício comercial azul"
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
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
 *                       example: "64a1234567890abcdef12345"
 *                     user:
 *                       type: string
 *                       example: "64a1234567890abcdef12340"
 *                     type:
 *                       type: string
 *                       example: "Residencial"
 *                     isDefault:
 *                       type: boolean
 *                       example: true
 *                     recipient:
 *                       type: string
 *                       example: "João Silva"
 *                     phoneNumber:
 *                       type: string
 *                       example: "(11) 99999-9999"
 *                     zipCode:
 *                       type: string
 *                       example: "01234-567"
 *                     street:
 *                       type: string
 *                       example: "Rua das Flores"
 *                     number:
 *                       type: string
 *                       example: "123"
 *                     complement:
 *                       type: string
 *                       example: "Apto 45"
 *                     neighborhood:
 *                       type: string
 *                       example: "Centro"
 *                     city:
 *                       type: string
 *                       example: "São Paulo"
 *                     state:
 *                       type: string
 *                       example: "SP"
 *                     reference:
 *                       type: string
 *                       example: "Próximo ao shopping"
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /addresses/{addressId}:
 *   put:
 *     summary: Atualizar endereço
 *     description: Atualiza um endereço específico do usuário autenticado
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         description: ID do endereço a ser atualizado
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [Residencial, Comercial, Outro]
 *                 example: "Comercial"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *               recipient:
 *                 type: string
 *                 example: "João Santos Silva"
 *               phoneNumber:
 *                 type: string
 *                 example: "(11) 88888-8888"
 *               zipCode:
 *                 type: string
 *                 example: "04567-890"
 *               street:
 *                 type: string
 *                 example: "Av. Paulista"
 *               number:
 *                 type: string
 *                 example: "1000"
 *               complement:
 *                 type: string
 *                 example: "Sala 501"
 *               neighborhood:
 *                 type: string
 *                 example: "Bela Vista"
 *               city:
 *                 type: string
 *                 example: "São Paulo"
 *               state:
 *                 type: string
 *                 example: "SP"
 *               reference:
 *                 type: string
 *                 example: "Edifício comercial azul"
 *           example:
 *             type: "Comercial"
 *             recipient: "João Santos Silva"
 *             phoneNumber: "(11) 88888-8888"
 *             complement: "Sala 502"
 *     responses:
 *       200:
 *         description: Endereço atualizado com sucesso
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
 *                   description: Dados do endereço atualizado
 *       400:
 *         description: Dados inválidos ou tentativa de remover último endereço padrão
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
 *                     - "ID de endereço inválido"
 *                     - "Você deve ter pelo menos um endereço padrão."
 *       403:
 *         description: Sem permissão para editar este endereço
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
 *                   example: "Você não tem permissão para editar este endereço"
 *       404:
 *         description: Endereço não encontrado
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /addresses/{addressId}:
 *   delete:
 *     summary: Deletar endereço
 *     description: Remove um endereço específico do usuário. Se for o endereço padrão, automaticamente define outro como padrão.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         description: ID do endereço a ser removido
 *         schema:
 *           type: string
 *           example: "64a1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Endereço removido com sucesso
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
 *                   example: "Endereço removido com sucesso"
 *                 newDefaultAddress:
 *                   type: object
 *                   nullable: true
 *                   description: Novo endereço padrão (se houver)
 *                   example: null
 *       403:
 *         description: Sem permissão para excluir este endereço
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
 *                   example: "Você não tem permissão para excluir este endereço"
 *       404:
 *         description: Endereço não encontrado
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
 *                   example: "Endereço não encontrado"
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */

router.route('/').get(getUserAddresses).post(createAddress);
router.route('/:addressId').put(updateAddress).delete(deleteAddress);

export default router;
