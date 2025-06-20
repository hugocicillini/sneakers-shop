import jwt from 'jsonwebtoken';
import { Client } from '../models/client.js';
import { User } from '../models/user.js';
import logger from '../utils/logger.js';

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, preferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso',
      });
    }

    const user = await Client.create({
      name,
      email,
      password,
      phone,
      preferences: preferences || {
        newsletterSubscribed: req.body.newsletter || false,
      },
    });

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    logger.info(`Novo usuário registrado: ${user._id}`);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: {
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`Erro ao registrar usuário: ${error.message}`);
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    logger.info(`Login de usuário: ${user._id}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`Erro no login: ${error.message}`);
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let user;

    if (req.user.userType === 'Client') {
      user = await Client.findById(userId)
        .select('-password -__v')
        .populate('defaultAddress');
    } else {
      user = await User.findById(userId).select('-password -__v');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(`Erro ao obter usuário: ${error.message}`);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, preferences } = req.body;

    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso por outro usuário',
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    if (user.userType === 'Client' && preferences) {
      const client = await Client.findById(userId);
      if (client) {
        client.preferences = {
          ...client.preferences,
          ...preferences,
        };
        await client.save();

        logger.info(`Preferências atualizadas para usuário: ${userId}`);
      }
    }

    let updatedUser;
    if (user.userType === 'Client') {
      updatedUser = await Client.findById(userId)
        .select('-password -__v')
        .populate('defaultAddress');
    } else {
      updatedUser = await User.findById(userId).select('-password -__v');
    }

    logger.info(`Perfil atualizado para usuário: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: updatedUser,
    });
  } catch (error) {
    logger.error(`Erro ao atualizar usuário: ${error.message}`);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 6 caracteres',
      });
    }

    const user = await User.findById(userId);

    const isMatch = await user.checkPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta',
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Senha alterada para usuário: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    logger.error(`Erro ao alterar senha: ${error.message}`);
    next(error);
  }
};
