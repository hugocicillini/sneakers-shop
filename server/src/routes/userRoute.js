import express from 'express';
import {
  loginUser,
  registerUser,
  updateUser,
} from '../controllers/userController.js';

const router = express.Router();

// router.get('/:id', getUser);
// router.get('/', getUsers);

router.post('/register', registerUser);
router.post('/login', loginUser);

router.put('/:id', updateUser);

// router.delete('/:id', deleteUser);

export default router;
