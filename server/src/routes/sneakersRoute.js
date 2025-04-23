import express from 'express';
import {
  createSneakers,
  getSneakerById,
  getSneakers,
} from '../controllers/sneakersController.js';

const router = express.Router();

/**
 * @swagger
 * /sneakers:
 *   get:
 *     summary: Obtém todos os tênis
 *     tags: [Sneakers]
 *     responses:
 *       200:
 *         description: Lista de tênis
 *       500:
 *         description: Erro ao buscar tênis
 */
// Obter todos os tênis
router.get('/', getSneakers);

/**
 * @swagger
 * /sneakers/{id}:
 *   get:
 *     summary: Obtém um tênis por ID
 *     tags: [Sneakers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do tênis
 *       500:
 *         description: Erro ao buscar o tênis
 */
// Obter um tênis por ID
router.get('/:id', getSneakerById);

// Adicionar um tênis
router.post('/add', createSneakers);

export default router;
