import express from 'express';
import {
  changePassword,
  getUser,
  loginUser,
  registerUser,
  updateUser,
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operações de autenticação
 *   - name: Users
 *     description: Gestão de usuários
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar novo usuário
 *     description: Cria uma nova conta de cliente no sistema
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao.silva@email.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "123"
 *               phone:
 *                 type: string
 *                 example: "(11) 99999-9999"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
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
 *                   example: "Usuário registrado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "João Silva"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Fazer login
 *     description: Autentica um usuário e retorna um token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@mail.com"
 *               password:
 *                 type: string
 *                 example: "123"
 *           example:
 *             email: "joao@mail.com"
 *             password: "123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "João Silva"
 *                         email:
 *                           type: string
 *                           example: "joao@mail.com"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Email e senha são obrigatórios
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
 *                   example: "Email e senha são obrigatórios"
 *       401:
 *         description: Credenciais inválidas
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
 *                   example: "Credenciais inválidas"
 *       403:
 *         description: Conta desativada
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
 *                   example: "Conta desativada. Entre em contato com o suporte."
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obter dados do usuário autenticado
 *     description: Retorna os dados completos do usuário atualmente autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário obtidos com sucesso
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
 *                     name:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao@mail.com"
 *                     phone:
 *                       type: string
 *                       example: "(11) 99999-9999"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     userType:
 *                       type: string
 *                       example: "Client"
 *       401:
 *         description: Token de acesso não fornecido
 *       404:
 *         description: Usuário não encontrado
 */

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Atualizar dados do usuário
 *     description: Atualiza os dados do usuário autenticado (exceto senha)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@mail.com"
 *               phone:
 *                 type: string
 *                 example: "(11) 88888-8888"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
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
 *                   example: "Perfil atualizado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a1234567890abcdef12345"
 *                     name:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao@mail.com"
 *       400:
 *         description: Email já está em uso
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Usuário não encontrado
 */

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Alterar senha do usuário
 *     description: Permite ao usuário alterar sua senha fornecendo a senha atual
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "novasenha123"
 *           example:
 *             currentPassword: "123"
 *             newPassword: "novasenha123"
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
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
 *                   example: "Senha alterada com sucesso"
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Senha atual incorreta
 */

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/', authMiddleware, getUser);
router.put('/', authMiddleware, updateUser);
router.put('/change-password', authMiddleware, changePassword);

export default router;
