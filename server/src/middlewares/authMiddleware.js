import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

// Middleware para verificar autenticação
export const authMiddleware = async (req, res, next) => {
  try {
    
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Não autorizado, nenhum token fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar validade do token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(401).json({ success: false, message: 'Não autorizado', error: error.message });
  }
};

// Middleware para autenticação opcional
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Sem token, continua como usuário não autenticado
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = user;
      }
    } catch (tokenError) {
      // Erro no token, mas continuamos como não autenticado
      console.log('Token inválido:', tokenError.message);
    }
    
    next();
  } catch (error) {
    // Em caso de erro, continuamos como não autenticado
    console.error('Erro no middleware de autenticação opcional:', error);
    next();
  }
};