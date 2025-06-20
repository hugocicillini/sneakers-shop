import { getAuthHeaders } from '@/lib/utils';

export const getUserAddresses = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/addresses`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

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
      `${import.meta.env.VITE_API_URL}/addresses/${addressId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
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

export const createUserAddress = async (addressData) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData),
    });

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
      `${import.meta.env.VITE_API_URL}/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao excluir endereço',
      };
    }

    return response.json();
  } catch (error) {
    console.error('Erro ao excluir endereço:', error);
    throw error;
  }
};
