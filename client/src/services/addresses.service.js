export const addUserAddress = async (userId, address) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        address,
      }),
    });

    return response.json();
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    throw error;
  }
};

export const updateUserAddress = async (addressId, addressData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/addresses/${addressId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      }
    );

    return response.json();
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    throw error;
  }
};

export const deleteUserAddress = async (addressId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
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
