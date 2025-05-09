import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.js';
import { Client } from '../models/client.js';
import { User } from '../models/user.js';
import logger from '../utils/logger.js';

// Middleware para verificar autenticação
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado, nenhum token fornecido',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado, faça login novamente',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    const baseUser = await User.findById(decoded.id).select('-password');
    if (!baseUser) {
      return res
        .status(401)
        .json({ success: false, message: 'Usuário não encontrado' });
    }

    if (!baseUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.',
      });
    }

    let user = baseUser;

    if (baseUser.userType === 'Client') {
      user = await Client.findById(decoded.id).select('-password');
    } else if (baseUser.userType === 'Admin') {
      user = await Admin.findById(decoded.id).select('-password');
    }

    req.user = user;

    next();
  } catch (error) {
    logger.error(`Erro no middleware de autenticação: ${error.message}`);
    next(error);
  }
};
