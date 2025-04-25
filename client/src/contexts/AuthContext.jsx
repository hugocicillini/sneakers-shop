import { loginUser, registerUser } from '@/services/users.service';
import { createContext, useContext, useEffect, useState } from 'react';

// Criar o contexto de autenticação
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  // Estado para armazenar os dados do usuário logado
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se existe um usuário salvo no localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao parsear usuário do localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Função atualizada para garantir que addresses sempre seja um array
  const updateUserState = (userData, options = {}) => {
    const { updateStorage = true, merge = false } = options;

    // Garantir que userData existe
    if (!userData) {
      console.error('Tentativa de atualizar estado com userData indefinido');
      return null;
    }

    // Criar uma cópia profunda dos dados para evitar modificações por referência
    const userDataCopy = JSON.parse(JSON.stringify(userData));

    // Garantir que addresses é sempre um array
    if (!userDataCopy.addresses) {
      userDataCopy.addresses = [];
    }

    // Criar o novo estado de usuário
    const newUserData =
      merge && user
        ? { ...JSON.parse(JSON.stringify(user)), ...userDataCopy }
        : userDataCopy;

    // Verificar se o estado realmente mudou para evitar atualizações redundantes
    if (user && JSON.stringify(user) === JSON.stringify(newUserData)) {
      return user; // Retorna o estado atual sem alterar
    }

    // Atualizar o estado - usar uma função para garantir o estado mais recente
    setUser(newUserData);

    // Atualizar localStorage
    if (updateStorage && newUserData) {
      localStorage.setItem('user', JSON.stringify(newUserData));
    }

    return newUserData;
  };

  // Função para realizar login
  const login = async (email, password) => {
    try {
      setLoading(true);

      // Chamada real para a API através do serviço
      const response = await loginUser(email, password);

      if (response.token) {
        // Extrair o token e armazenar separadamente
        const { token, ...userData } = response;

        // Salvar token separadamente
        localStorage.setItem('token', token);

        // Salvar dados do usuário sem o token
        localStorage.setItem('user', JSON.stringify(userData));

        // Atualizar o estado do usuário
        setUser(userData);
        return { success: true };
      } else {
        return {
          success: false,
          message: response.message || 'Credenciais inválidas',
        };
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return {
        success: false,
        message: 'Erro ao processar o login. Tente novamente.',
      };
    } finally {
      setLoading(false);
    }
  };

  // Função para registrar um novo usuário
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await registerUser(name, email, password);

      if (response.success) {
        // Salvar dados do usuário e token
        const { token, ...userData } = response;
        // Salvar token separadamente
        localStorage.setItem('token', token);

        // Salvar dados do usuário sem o token
        localStorage.setItem('user', JSON.stringify(userData));

        // Atualizar o estado do usuário
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return { success: false, message: 'Erro ao processar o registro' };
    } finally {
      setLoading(false);
    }
  };

  // Função para realizar logout
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('favorites')
    setUser(null);
  };

  // Verificar se o usuário está autenticado
  const isAuthenticated = !!user;

  // Valores a serem fornecidos pelo contexto
  const value = {
    user,
    updateUserState,
    login,
    register,
    logout,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
