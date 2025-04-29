export const getWishlist = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/wishlists`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao buscar wishlist',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar wishlist:', error);
    return { success: false, message: error.message };
  }
};

export const addToWishlist = async (sneakerId) => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/wishlists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sneakerId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Erro ao adicionar à wishlist',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao adicionar à wishlist:', error);
    return { success: false, message: error.message };
  }
};

export const removeFromWishlist = async (sneakerId) => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/wishlists/${sneakerId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    return data;
  } catch (error) {
    console.error('Erro ao remover da wishlist:', error);
    return { success: false, message: error.message };
  }
};
