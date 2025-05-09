export const loginUser = async (email, password) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Tratamento mais detalhado por código de status
      if (response.status === 401) {
        return {
          success: false,
          message: 'Email ou senha incorretos',
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'Conta desativada. Entre em contato com o suporte.',
        };
      }

      return {
        success: false,
        message: data.message || 'Erro ao fazer login',
      };
    }

    return { ...data, success: true };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return {
      success: false,
      message: 'Erro de conexão ao tentar fazer login',
    };
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao registrar conta',
      };
    }

    const data = await response.json();
    return { ...data, success: true };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return {
      success: false,
      message: 'Erro de conexão ao tentar registrar',
    };
  }
};

export const getUser = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuário');
    }

    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return { success: false, message: error.message };
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/refresh-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao renovar token');
    }

    const data = await response.json();
    return { success: true, token: data.token };
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return { success: false, message: error.message };
  }
};
