export const getWishlist = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/wishlists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao buscar wishlist',
      };
    }

    const result = await response.json();
    return {
      success: true,
      wishlist: result.data.sneakers || [],
    };
  } catch (error) {
    console.error('Erro ao buscar wishlist:', error);
    return { success: false, message: 'Erro de conexão ao buscar wishlist' };
  }
};

export const addToWishlist = async (sneakerId) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/wishlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ sneakerId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao adicionar à wishlist',
      };
    }

    const data = await response.json();
    return {
      success: true,
      wishlist: data.data.sneakers || [],
    };
  } catch (error) {
    console.error('Erro ao adicionar à wishlist:', error);
    return {
      success: false,
      message: 'Erro de conexão ao adicionar à wishlist',
    };
  }
};

export const removeFromWishlist = async (sneakerId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/wishlists/${sneakerId}`,
      {
        method: 'DELETE',
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
        message: errorData.message || 'Erro ao remover da wishlist',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Item removido com sucesso',
    };
  } catch (error) {
    console.error('Erro ao remover da wishlist:', error);
    return {
      success: false,
      message: 'Erro de conexão ao remover da wishlist',
    };
  }
};
