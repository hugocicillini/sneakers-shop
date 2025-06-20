import express from 'express';
import {
  getUser,
  loginUser,
  registerUser,
  updateUser,
  changePassword
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/', authMiddleware, getUser);
router.put('/', authMiddleware, updateUser);
router.put('/change-password', authMiddleware, changePassword);

export default router;