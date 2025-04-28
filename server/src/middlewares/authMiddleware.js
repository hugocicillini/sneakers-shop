import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { Client } from '../models/clientModel.js';

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
    
    // Buscar usuário base para determinar o tipo
    const baseUser = await User.findById(decoded.id).select('-password');
    if (!baseUser) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    let user = baseUser;
    
    // Se for um cliente, buscar usando o modelo Client para ter acesso a todos os campos
    if (baseUser.userType === 'Client') {
      user = await Client.findById(decoded.id).select('-password');
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
      
      // Buscar usuário base para determinar o tipo
      const baseUser = await User.findById(decoded.id).select('-password');
      
      if (baseUser) {
        let user = baseUser;
        
        // Se for um cliente, buscar usando o modelo Client
        if (baseUser.userType === 'Client') {
          user = await Client.findById(decoded.id).select('-password');
        }
        
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