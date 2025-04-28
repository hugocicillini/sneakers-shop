import jwt from 'jsonwebtoken';
import { Client } from '../models/clientModel.js';
import { User } from '../models/userModel.js';

// Registrar um novo usuário
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const user = await Client.create({
      name,
      email,
      password,
      phone,
    });

    const token = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.status(201).json({
      token: token,
      name: user.name,
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res
      .status(500)
      .json({ message: 'Erro ao registrar usuário', error: error.message });
  }
};

// Login de usuário
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.status(200).json({
      token: token,
      name: user.name,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao fazer login', error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const baseUser = await User.findById(userId).select('-password -__v');
    if (!baseUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (baseUser.userType === 'Client') {
      const clientUser = await Client.findById(userId)
        .select('-password -__v')
        .populate('defaultAddress');

      return res.status(200).json(clientUser);
    }

    res.status(200).json(baseUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao obter usuário', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, preferences } = req.body;

    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    // Se for um cliente e tiver preferências para atualizar
    if (user.userType === 'client' && preferences) {
      const client = await Client.findById(id);
      if (client) {
        client.preferences = {
          ...client.preferences,
          ...preferences,
        };
        await client.save();
      }
    }

    await user.save();

    // Preparar resposta com base no tipo de usuário
    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      phone: user.phone,
    };

    res.status(200).json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};
