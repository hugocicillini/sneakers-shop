import express from 'express';
import {
  createSneaker,
  deleteSneaker,
  getSneakerBySlug,
  getSneakers,
  getSneakerVariants,
  updateSneaker,
  updateVariantStock,
} from '../controllers/sneakerController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Sneakers
 *     description: Gestão de tênis e catálogo de produtos
 */

/**
 * @swagger
 * /sneakers:
 *   get:
 *     summary: Buscar tênis
 *     description: Busca tênis com filtros avançados, paginação e ordenação. Suporta busca por texto, filtros por marca, categoria, tamanho, cor, gênero, preço e tags.
 *     tags: [Sneakers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome, descrição ou marca
 *         example: "Air Jordan"
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtrar por marcas (separadas por vírgula)
 *         example: "Nike,Adidas"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categorias (separadas por vírgula)
 *         example: "Basketball,Running"
 *       - in: query
 *         name: sizes
 *         schema:
 *           type: string
 *         description: Filtrar por tamanhos (separados por vírgula)
 *         example: "40,41,42"
 *       - in: query
 *         name: colors
 *         schema:
 *           type: string
 *         description: Filtrar por cores (separadas por vírgula)
 *         example: "Vermelho,Preto"
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filtrar por gênero (separados por vírgula)
 *         example: "masculino,unisex"
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filtrar por tags (separadas por vírgula)
 *         example: "basketball,retro"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *         example: 200
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *         example: 1000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Número de itens por página
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Ordenação (ex - price, -rating, name)
 *         example: "-price"
 *     responses:
 *       200:
 *         description: Lista de tênis recuperada com sucesso
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
 *                     total:
 *                       type: number
 *                       example: 156
 *                     page:
 *                       type: number
 *                       example: 1
 *                     limit:
 *                       type: number
 *                       example: 10
 *                     totalPages:
 *                       type: number
 *                       example: 16
 *                     sneakers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                           name:
 *                             type: string
 *                             example: "Nike Air Jordan 1 Retro High"
 *                           slug:
 *                             type: string
 *                             example: "nike-air-jordan-1-retro-high"
 *                           basePrice:
 *                             type: number
 *                             example: 899.99
 *                           finalPrice:
 *                             type: number
 *                             example: 809.99
 *                           coverImage:
 *                             type: object
 *                             properties:
 *                               url:
 *                                 type: string
 *                                 example: "https://example.com/jordan1.jpg"
 *                               alt:
 *                                 type: string
 *                                 example: "Nike Air Jordan 1"
 *                           brand:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Nike"
 *                           rating:
 *                             type: number
 *                             example: 4.5
 *                           reviewCount:
 *                             type: number
 *                             example: 128
 *             examples:
 *               sucesso:
 *                 summary: Busca bem-sucedida
 *                 value:
 *                   success: true
 *                   data:
 *                     total: 156
 *                     page: 1
 *                     limit: 10
 *                     totalPages: 16
 *                     sneakers:
 *                       - _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                         name: "Nike Air Jordan 1 Retro High"
 *                         slug: "nike-air-jordan-1-retro-high"
 *                         basePrice: 899.99
 *                         finalPrice: 809.99
 *                         coverImage:
 *                           url: "https://example.com/jordan1.jpg"
 *                           alt: "Nike Air Jordan 1"
 *                         brand:
 *                           name: "Nike"
 *                         rating: 4.5
 *                         reviewCount: 128
 *       400:
 *         description: Parâmetros de consulta inválidos
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
 *                   example: "Parâmetros inválidos"
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
router.get('/', getSneakers);

/**
 * @swagger
 * /sneakers/{slug}:
 *   get:
 *     summary: Obter detalhes do tênis por slug
 *     description: Retorna informações detalhadas de um tênis específico pelo seu slug. Inclui variantes, reviews, tênis relacionados e informações de estoque por cor/tamanho.
 *     tags: [Sneakers]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug único do tênis
 *         example: "nike-air-jordan-1-retro-high"
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Cor preferida para visualização
 *         example: "Vermelho"
 *     responses:
 *       200:
 *         description: Detalhes do tênis recuperados com sucesso
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
 *                     name:
 *                       type: string
 *                       example: "Nike Air Jordan 1 Retro High"
 *                     slug:
 *                       type: string
 *                       example: "nike-air-jordan-1-retro-high"
 *                     basePrice:
 *                       type: number
 *                       example: 899.99
 *                     finalPrice:
 *                       type: number
 *                       example: 809.99
 *                     description:
 *                       type: string
 *                       example: "O icônico Air Jordan 1 Retro High..."
 *                     selectedColor:
 *                       type: string
 *                       example: "Vermelho"
 *                     sizesInStock:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                           size:
 *                             type: number
 *                             example: 42
 *                           stock:
 *                             type: number
 *                             example: 15
 *                           finalPrice:
 *                             type: number
 *                             example: 809.99
 *                           isAvailable:
 *                             type: boolean
 *                             example: true
 *                     colorsInStock:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["vermelho", "preto", "branco"]
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rating:
 *                             type: number
 *                             example: 5
 *                           comment:
 *                             type: string
 *                             example: "Tênis excelente!"
 *                           user:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "João Silva"
 *                     relatedSneakers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b5"
 *                           name:
 *                             type: string
 *                             example: "Nike Air Jordan 1 Low"
 *                           slug:
 *                             type: string
 *                             example: "nike-air-jordan-1-low"
 *             examples:
 *               detalhes_sucesso:
 *                 summary: Detalhes recuperados com sucesso
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     name: "Nike Air Jordan 1 Retro High"
 *                     slug: "nike-air-jordan-1-retro-high"
 *                     basePrice: 899.99
 *                     finalPrice: 809.99
 *                     description: "O icônico Air Jordan 1 Retro High..."
 *                     selectedColor: "Vermelho"
 *                     sizesInStock:
 *                       - id: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                         size: 42
 *                         stock: 15
 *                         finalPrice: 809.99
 *                         isAvailable: true
 *                     colorsInStock: ["vermelho", "preto", "branco"]
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
router.get('/:slug', getSneakerBySlug);

/**
 * @swagger
 * /sneakers/{sneakerId}/variants:
 *   get:
 *     summary: Obter variantes do tênis
 *     description: Retorna todas as variantes ativas de um tênis específico (tamanhos e cores disponíveis)
 *     tags: [Sneakers]
 *     parameters:
 *       - in: path
 *         name: sneakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tênis
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Variantes recuperadas com sucesso
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
 *                         example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                       sneaker:
 *                         type: string
 *                         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                       size:
 *                         type: number
 *                         example: 42
 *                       color:
 *                         type: string
 *                         example: "Vermelho"
 *                       stock:
 *                         type: number
 *                         example: 15
 *                       finalPrice:
 *                         type: number
 *                         example: 809.99
 *             examples:
 *               variantes_sucesso:
 *                 summary: Variantes encontradas
 *                 value:
 *                   success: true
 *                   data:
 *                     - _id: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                       sneaker: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                       size: 42
 *                       color: "Vermelho"
 *                       stock: 15
 *                       finalPrice: 809.99
 *                     - _id: "60f7b3b3b3b3b3b3b3b3b3b5"
 *                       sneaker: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                       size: 43
 *                       color: "Vermelho"
 *                       stock: 8
 *                       finalPrice: 809.99
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
router.get('/:sneakerId/variants', getSneakerVariants);

/**
 * @swagger
 * /sneakers:
 *   post:
 *     summary: Criar novo tênis
 *     description: Cria um novo tênis com suas variantes. Requer permissões de administrador.
 *     tags: [Sneakers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sneakerData
 *             properties:
 *               sneakerData:
 *                 type: object
 *                 required:
 *                   - name
 *                   - basePrice
 *                   - brand
 *                   - description
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Nike Air Jordan 1 Retro High"
 *                   basePrice:
 *                     type: number
 *                     minimum: 0
 *                     example: 899.99
 *                   brand:
 *                     type: string
 *                     description: ID da marca
 *                     example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                   description:
 *                     type: string
 *                     example: "O icônico Air Jordan 1 Retro High..."
 *                   shortDescription:
 *                     type: string
 *                     example: "Tênis icônico da Jordan"
 *                   category:
 *                     type: string
 *                     description: ID da categoria
 *                     example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                   gender:
 *                     type: string
 *                     enum: [masculino, feminino, unisex]
 *                     example: "unisex"
 *                   baseDiscount:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 10
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["basketball", "retro"]
 *                   isFeatured:
 *                     type: boolean
 *                     example: false
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - size
 *                     - color
 *                     - stock
 *                   properties:
 *                     size:
 *                       type: number
 *                       example: 42
 *                     color:
 *                       type: string
 *                       example: "Vermelho"
 *                     colorName:
 *                       type: string
 *                       example: "Vermelho Chicago"
 *                     colorHex:
 *                       type: string
 *                       example: "#CD212A"
 *                     stock:
 *                       type: number
 *                       minimum: 0
 *                       example: 15
 *                     price:
 *                       type: number
 *                       example: 899.99
 *                     discount:
 *                       type: number
 *                       example: 10
 *           examples:
 *             novo_tenis:
 *               summary: Criação de novo tênis
 *               value:
 *                 sneakerData:
 *                   name: "Nike Air Jordan 1 Retro High"
 *                   basePrice: 899.99
 *                   brand: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                   description: "O icônico Air Jordan 1 Retro High combina estilo clássico..."
 *                   shortDescription: "Tênis icônico da Jordan"
 *                   category: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                   gender: "unisex"
 *                   baseDiscount: 10
 *                   tags: ["basketball", "retro", "jordanbrand"]
 *                 variants:
 *                   - size: 42
 *                     color: "Vermelho"
 *                     colorName: "Vermelho Chicago"
 *                     colorHex: "#CD212A"
 *                     stock: 15
 *                   - size: 43
 *                     color: "Vermelho"
 *                     colorName: "Vermelho Chicago"
 *                     colorHex: "#CD212A"
 *                     stock: 12
 *     responses:
 *       201:
 *         description: Tênis criado com sucesso
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
 *                     name:
 *                       type: string
 *                       example: "Nike Air Jordan 1 Retro High"
 *                     basePrice:
 *                       type: number
 *                       example: 899.99
 *                     variants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                           size:
 *                             type: number
 *                             example: 42
 *                           color:
 *                             type: string
 *                             example: "Vermelho"
 *                           stock:
 *                             type: number
 *                             example: 15
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
 *             examples:
 *               campos_obrigatorios:
 *                 summary: Campos obrigatórios ausentes
 *                 value:
 *                   success: false
 *                   message: "Nome, preço base e marca são obrigatórios"
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
 *       403:
 *         description: Permissões insuficientes
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
 *                   example: "Permissão negada. Apenas administradores podem criar produtos."
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
router.post('/', authMiddleware, createSneaker);

/**
 * @swagger
 * /sneakers/{sneakerId}:
 *   put:
 *     summary: Atualizar tênis
 *     description: Atualiza informações de um tênis e suas variantes. Requer permissões de administrador.
 *     tags: [Sneakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sneakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tênis a ser atualizado
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sneakerData:
 *                 type: object
 *                 description: Dados do tênis a serem atualizados
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Nike Air Jordan 1 Retro High Updated"
 *                   basePrice:
 *                     type: number
 *                     example: 949.99
 *                   description:
 *                     type: string
 *                     example: "Descrição atualizada do produto..."
 *                   baseDiscount:
 *                     type: number
 *                     example: 15
 *               variants:
 *                 type: array
 *                 description: Variantes a serem atualizadas ou criadas
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID da variante (para atualização) ou omitir para criar nova
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                     size:
 *                       type: number
 *                       example: 42
 *                     color:
 *                       type: string
 *                       example: "Azul"
 *                     stock:
 *                       type: number
 *                       example: 20
 *           examples:
 *             atualizacao_basica:
 *               summary: Atualização básica
 *               value:
 *                 sneakerData:
 *                   name: "Nike Air Jordan 1 Retro High Chicago"
 *                   basePrice: 949.99
 *                   baseDiscount: 15
 *                 variants:
 *                   - _id: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                     stock: 25
 *                   - size: 44
 *                     color: "Azul"
 *                     stock: 10
 *     responses:
 *       200:
 *         description: Tênis atualizado com sucesso
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
 *                     name:
 *                       type: string
 *                       example: "Nike Air Jordan 1 Retro High Chicago"
 *                     basePrice:
 *                       type: number
 *                       example: 949.99
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
 *             examples:
 *               nome_vazio:
 *                 summary: Nome vazio
 *                 value:
 *                   success: false
 *                   message: "Nome não pode ser vazio"
 *               preco_invalido:
 *                 summary: Preço inválido
 *                 value:
 *                   success: false
 *                   message: "Preço base deve ser maior que zero"
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
 *       403:
 *         description: Permissões insuficientes
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
 *                   example: "Permissão negada. Apenas administradores podem modificar produtos."
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
router.put('/:sneakerId', authMiddleware, updateSneaker);

/**
 * @swagger
 * /sneakers/{sneakerId}:
 *   delete:
 *     summary: Deletar tênis
 *     description: Remove um tênis do catálogo (soft delete - marca como inativo). Também desativa todas as variantes relacionadas. Requer permissões de administrador.
 *     tags: [Sneakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sneakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tênis a ser deletado
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Tênis deletado com sucesso
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
 *                   example: "Tênis deletado com sucesso"
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
 *       403:
 *         description: Permissões insuficientes
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
 *                   example: "Permissão negada. Apenas administradores podem modificar produtos."
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
router.delete('/:sneakerId', authMiddleware, deleteSneaker);

/**
 * @swagger
 * /sneakers/variants/{variantId}/stock:
 *   put:
 *     summary: Atualizar estoque de variante
 *     description: Atualiza o estoque de uma variante específica de tênis. Requer permissões de administrador.
 *     tags: [Sneakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da variante do tênis
 *         example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: number
 *                 minimum: 0
 *                 description: Nova quantidade em estoque
 *                 example: 25
 *           examples:
 *             atualizar_estoque:
 *               summary: Atualização de estoque
 *               value:
 *                 stock: 25
 *     responses:
 *       200:
 *         description: Estoque atualizado com sucesso
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
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                     sneaker:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     size:
 *                       type: number
 *                       example: 42
 *                     color:
 *                       type: string
 *                       example: "Vermelho"
 *                     stock:
 *                       type: number
 *                       example: 25
 *                     finalPrice:
 *                       type: number
 *                       example: 809.99
 *             examples:
 *               estoque_atualizado:
 *                 summary: Estoque atualizado com sucesso
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                     sneaker: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     size: 42
 *                     color: "Vermelho"
 *                     stock: 25
 *                     finalPrice: 809.99
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
 *                   example: "Dados inválidos"
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
 *       403:
 *         description: Permissões insuficientes
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
 *                   example: "Permissão negada. Apenas administradores podem modificar produtos."
 *       404:
 *         description: Variante não encontrada
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
 *                   example: "Variante não encontrada"
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
router.put('/variants/:variantId/stock', authMiddleware, updateVariantStock);

export default router;
