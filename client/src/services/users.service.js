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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao fazer login',
      };
    }

    const data = await response.json();
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
        body: JSON.stringify({ name, email, password }),
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

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }
    );

    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};
