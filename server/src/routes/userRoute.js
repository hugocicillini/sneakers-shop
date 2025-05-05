import express from 'express';
import {
  getUser,
  loginUser,
  registerUser,
  updateUser,
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getUser);
// router.get('/', getUsers);

router.post('/register', registerUser);
router.post('/login', loginUser);

router.put('/', authMiddleware, updateUser);

// router.delete('/:id', deleteUser);

export default router;
