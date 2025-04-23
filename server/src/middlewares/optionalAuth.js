import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user) {
        req.user = { id: user._id, name: user.name, email: user.email };
      }
    } catch (error) {
      // Token inválido, apenas ignora e segue sem req.user
    }
  }
  next();
};

export default optionalAuth;
