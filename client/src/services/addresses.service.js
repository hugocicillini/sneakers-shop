export const getUserAddresses = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/addresses`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao buscar endereços',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    return {
      success: false,
      message: 'Erro de conexão ao buscar endereços',
    };
  }
};

export const updateUserAddress = async (addressId, addressData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/addresses/${addressId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(addressData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao atualizar endereço',
      };
    }

    const data = await response.json();
    return { success: true, address: data.address };
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return {
      success: false,
      message: 'Erro de conexão ao atualizar endereço',
    };
  }
};

export const createAddress = async (addressData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/addresses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(addressData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao criar endereço',
      };
    }

    const data = await response.json();
    return { success: true, address: data.address };
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return {
      success: false,
      message: 'Erro de conexão ao criar endereço',
    };
  }
};

export const deleteUserAddress = async (addressId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao excluir endereço');
    }

    return response.json();
  } catch (error) {
    console.error('Erro ao excluir endereço:', error);
    throw error;
  }
};
