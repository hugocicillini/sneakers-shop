import {
  getAuthHeaders,
  getCartFromLocalStorage,
  isAuthenticated,
  saveCartToLocalStorage,
} from '@/lib/utils';

export const getCart = async () => {
  try {
    if (!isAuthenticated()) {
      return getCartFromLocalStorage();
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/carts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      return data.cart || data;
    }

    console.warn('Erro ao buscar carrinho do servidor, usando localStorage');
    return getCartFromLocalStorage();
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    return getCartFromLocalStorage();
  }
};

export const addToCart = async (item) => {
  if (!item.sneakerId) {
    return { success: false, error: 'ID do produto é necessário' };
  }

  try {
    const cartItem = {
      ...item,
      quantity: item.quantity || 1,
    };

    if (isAuthenticated()) {
      if (!cartItem.variantId && cartItem.sizeId) {
        cartItem.variantId = cartItem.sizeId;
      } else if (!cartItem.variantId) {
        if (cartItem.colorId) {
          cartItem.variantId = cartItem.colorId;
        } else {
          console.warn('variantId não fornecido, tentando gerar um substituto');
          if (cartItem.size && cartItem.color) {
            cartItem.variantId =
              cartItem.sizeId ||
              `${cartItem.sneakerId}-${cartItem.size}-${cartItem.color}`;
          } else {
            return {
              success: false,
              error:
                'variantId, sizeId ou combinação de size e color é obrigatório',
            };
          }
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/carts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cartItem),
      });

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return addToLocalCart(cartItem);
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    return { success: false, error: error.message };
  }
};

const addToLocalCart = (item) => {
  const cart = getCartFromLocalStorage();

  const existingIndex = cart.items.findIndex(
    (i) =>
      i.sneakerId === item.sneakerId &&
      i.size === item.size &&
      i.color === item.color
  );

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
  } else {
    cart.items.push({
      ...item,
      cartItemId: `${item.sneakerId}-${item.size}-${item.color}-${Date.now()}`,
    });
  }

  saveCartToLocalStorage(cart);
  return { success: true, cart };
};

export const updateCartItemQuantity = async (cartItemId, quantity) => {
  if (quantity < 1)
    return { success: false, error: 'Quantidade deve ser pelo menos 1' };

  try {
    if (isAuthenticated()) {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/carts/${cartItemId}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ quantity }),
        }
      );

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Falha ao atualizar quantidade');
    } else {
      const cart = getCartFromLocalStorage();
      const updatedItems = cart.items.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );

      const updatedCart = { ...cart, items: updatedItems };
      saveCartToLocalStorage(updatedCart);
      return { success: true, cart: updatedCart };
    }
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    return { success: false, error: error.message };
  }
};

export const removeFromCart = async (cartItemId) => {
  try {
    if (isAuthenticated()) {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/carts/${cartItemId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Falha ao remover item');
    } else {
      const cart = getCartFromLocalStorage();
      const updatedCart = {
        ...cart,
        items: cart.items.filter((item) => item.cartItemId !== cartItemId),
      };

      saveCartToLocalStorage(updatedCart);
      return { success: true, cart: updatedCart };
    }
  } catch (error) {
    console.error('Erro ao remover item:', error);
    return { success: false, error: error.message };
  }
};

export const clearCart = async () => {
  try {
    if (isAuthenticated()) {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/carts`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        localStorage.removeItem('cart');
        return await response.json();
      }
      throw new Error('Falha ao limpar carrinho');
    }

    localStorage.removeItem('cart');
    return { success: true, cart: { items: [] } };
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    return { success: false, error: error.message };
  }
};