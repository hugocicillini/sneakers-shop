import {
  loginUser,
  refreshToken,
  registerUser,
} from '@/services/users.service';
import { createContext, useContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
          setLoading(false);
          return;
        }
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000;

        if (Date.now() >= expirationTime) {
          logout();
        } else {
          setUser(JSON.parse(storedUser));

          const timeToExpire = expirationTime - Date.now();
          if (timeToExpire < 24 * 60 * 60 * 1000) {
            setTimeout(() => refreshTokenUser(), timeToExpire - 60000);
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

  const refreshTokenUser = async () => {
    try {
      const response = await refreshToken();

      if (response.success) {
        const { token } = response;

        localStorage.setItem('token', token);

        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000;
        const timeToExpire = expirationTime - Date.now();

        if (timeToExpire > 60000) {
          if (refreshTimeout) clearTimeout(refreshTimeout);

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

  const login = async (email, password) => {
    try {
      setLoading(true);

      const response = await loginUser(email, password);

      if (response.success) {
        const { token, ...userData } = response.data;

        localStorage.setItem('token', token);

        localStorage.setItem('user', JSON.stringify(userData));

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

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await registerUser(name, email, password);

      if (response.success) {
        const { token, ...userData } = response.data;

        localStorage.setItem('token', token);

        localStorage.setItem('user', JSON.stringify(userData));

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

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (refreshTimeout) clearTimeout(refreshTimeout);
    setRefreshTimeout(null);
    setUser(null);
  };

  const updateUserData = (newUserData) => {
    try {
      const userData = newUserData.data ? newUserData.data : newUserData;

      setUser((prevUser) => {
        if (prevUser && prevUser.user) {
          return {
            ...prevUser,
            user: {
              ...prevUser.user,
              ...userData,
            },
          };
        }
        return {
          ...prevUser,
          ...userData,
        };
      });

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

  const isAuthenticated = !!user;

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
