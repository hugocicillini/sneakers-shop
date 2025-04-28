export const getUserFavorites = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return { success: false, message: error.message };
  }
};

export const addFavorite = async (sneakerId) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ sneakerId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    return { success: false, message: error.message };
  }
};

export const removeFavorite = async (sneakerId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/wishlist/${sneakerId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    return { success: false, message: error.message };
  }
};

export const checkIsFavorite = (favorites, sneakerId) => {
  if (!favorites || !Array.isArray(favorites.sneakers)) {
    return false;
  }
  return favorites.sneakers.includes(sneakerId);
};
