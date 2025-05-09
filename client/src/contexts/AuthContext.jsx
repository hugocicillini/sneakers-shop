import {
  loginUser,
  refreshToken,
  registerUser,
} from '@/services/users.service';
import { createContext, useContext, useEffect, useState } from 'react';

// Criar o contexto de autenticação
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  // Estado para armazenar os dados do usuário logado
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  // Verificar se existe um usuário salvo no localStorage ao iniciar
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
          setLoading(false);
          return;
        }
        // Verificar se o token expirou
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // converter para milissegundos

        if (Date.now() >= expirationTime) {
          logout();
        } else {
          setUser(JSON.parse(storedUser));

          // Configurar timer para renovar token antes de expirar
          const timeToExpire = expirationTime - Date.now();
          if (timeToExpire < 24 * 60 * 60 * 1000) {
            // Se expira em menos de 24h
            setTimeout(() => refreshTokenUser(), timeToExpire - 60000); // Renovar 1 min antes
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  // Função para renovar o token
  const refreshTokenUser = async () => {
    try {
      const response = await refreshToken();

      if (response.success) {
        const { token } = response;

        // Salvar novo token
        localStorage.setItem('token', token);

        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000;
        const timeToExpire = expirationTime - Date.now();

        if (timeToExpire > 60000) {
          // Limpar timeout anterior se existir
          if (refreshTimeout) clearTimeout(refreshTimeout);

          // Definir novo timeout
          const timeout = setTimeout(refreshTokenUser, timeToExpire - 60000);
          setRefreshTimeout(timeout);
        }
      } else {
        console.error('Erro ao renovar token:', response.message);
        logout();
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
    }
  };

  // Função para realizar login
  const login = async (email, password) => {
    try {
      setLoading(true);

      // Chamada real para a API através do serviço
      const response = await loginUser(email, password);

      if (response.success) {
        // Extrair o token e armazenar separadamente
        const { token, ...userData } = response.data;

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
        const { token, ...userData } = response.data;
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
    if (refreshTimeout) clearTimeout(refreshTimeout);
    setRefreshTimeout(null);
    setUser(null);
  };

  const updateUserData = (newUserData) => {
    try {
      // Mesclar com dados existentes
      const userData = newUserData.data ? newUserData.data : newUserData;

      // Atualizar o estado do usuário
      setUser((prevUser) => {
        // Se o usuario atual tem propriedade user (estrutura aninhada)
        if (prevUser && prevUser.user) {
          return {
            ...prevUser,
            user: {
              ...prevUser.user,
              ...userData,
            },
          };
        }
        // Caso contrário, atualizar diretamente
        return {
          ...prevUser,
          ...userData,
        };
      });

      // Atualizar no localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem(
            'user',
            JSON.stringify({
              ...parsedUser,
              ...(parsedUser.user
                ? { user: { ...parsedUser.user, ...userData } }
                : userData),
            })
          );
        } catch (error) {
          console.error('Erro ao atualizar dados no localStorage:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      return false;
    }
  };

  // Verificar se o usuário está autenticado
  const isAuthenticated = !!user;

  // Valores a serem fornecidos pelo contexto
  const value = {
    user,
    setUser,
    updateUserData,
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
