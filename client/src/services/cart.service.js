// Serviço para manipulação do carrinho de compras - Versão simplificada

// Helpers básicos
const isAuthenticated = () => !!localStorage.getItem('token');

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token')
    ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
    : {}),
});

const getCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem('cart');
  return savedCart ? JSON.parse(savedCart) : { items: [] };
};

const saveCartToLocalStorage = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

// Buscar carrinho (do servidor se autenticado, ou do localStorage)
export const getCart = async () => {
  try {
    // Se não está autenticado, retorna o carrinho local
    if (!isAuthenticated()) {
      return getCartFromLocalStorage();
    }

    // Buscar carrinho do servidor
    const response = await fetch(`${import.meta.env.VITE_API_URL}/carts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      return data.cart || data;
    }

    // Fallback para localStorage em caso de erro
    console.warn('Erro ao buscar carrinho do servidor, usando localStorage');
    return getCartFromLocalStorage();
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    return getCartFromLocalStorage();
  }
};

// Adicionar item ao carrinho
export const addToCart = async (item) => {
  if (!item.sneakerId) {
    return { success: false, error: 'ID do produto é necessário' };
  }

  try {
    // Preparar o item para adicionar
    const cartItem = {
      ...item,
      quantity: item.quantity || 1,
    };

    // Para usuários autenticados, enviar para o servidor
    if (isAuthenticated()) {
      // Tratar o variantId que é obrigatório
      // Usar sizeId como variantId se ele não existir
      if (!cartItem.variantId && cartItem.sizeId) {
        cartItem.variantId = cartItem.sizeId;
      }
      // Se não tiver variantId nem sizeId, usar colorId ou gerar um ID baseado em propriedades
      else if (!cartItem.variantId) {
        if (cartItem.colorId) {
          cartItem.variantId = cartItem.colorId;
        } else {
          // Gerar um ID com base nas propriedades disponíveis
          console.warn('variantId não fornecido, tentando gerar um substituto');
          // Verificar se temos um sizeId válido primeiro antes de usar propriedades alternativas
          if (cartItem.size && cartItem.color) {
            // Construir um ID baseado no produto, tamanho e cor
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

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/carts`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(cartItem),
        }
      );

      if (response.ok) {
        return await response.json();
      }

      // Obter detalhes do erro
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    // Para usuários não autenticados, salvar no localStorage
    return addToLocalCart(cartItem);
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    return { success: false, error: error.message };
  }
};

// Adicionar ao carrinho local
const addToLocalCart = (item) => {
  const cart = getCartFromLocalStorage();

  // Verificar se o item já existe
  const existingIndex = cart.items.findIndex(
    (i) =>
      i.sneakerId === item.sneakerId &&
      i.size === item.size &&
      i.color === item.color
  );

  // Item já existe: atualizar quantidade
  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
  } else {
    // Novo item: adicionar ao carrinho com ID único
    cart.items.push({
      ...item,
      cartItemId: `${item.sneakerId}-${item.size}-${item.color}-${Date.now()}`,
    });
  }

  // Salvar carrinho atualizado
  saveCartToLocalStorage(cart);
  return { success: true, cart };
};

// Atualizar quantidade
export const updateCartItemQuantity = async (cartItemId, quantity) => {
  if (quantity < 1)
    return { success: false, error: 'Quantidade deve ser pelo menos 1' };

  console.log('Atualizando quantidade do item:', cartItemId, quantity);

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

// Remover item do carrinho
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

// Limpar carrinho
export const clearCart = async () => {
  try {
    if (isAuthenticated()) {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/carts`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

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

// Sincronizar carrinho do localStorage para o servidor (após login)
export const syncCart = async () => {
  // Só prosseguir se estiver autenticado
  if (!isAuthenticated()) {
    return { success: false, message: 'Usuário não autenticado' };
  }

  // Verificar se existe um carrinho local para sincronizar
  const localCart = getCartFromLocalStorage();
  if (!localCart.items || localCart.items.length === 0) {
    return { success: true, message: 'Nenhum item para sincronizar' };
  }

  try {
    let successCount = 0;

    // Adicionar cada item do carrinho local ao servidor
    for (const item of localCart.items) {
      try {
        // Remover propriedades que podem causar problemas
        const cleanItem = {
          sneakerId: item.sneakerId,
          size: item.size,
          color: item.color,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          brand: item.brand,
          slug: item.slug,
        };

        const result = await addToCart(cleanItem);
        if (result.success) {
          successCount++;
        }
      } catch (e) {
        console.warn(
          `Falha ao adicionar item ${item.name || item.sneakerId}:`,
          e
        );
      }
    }

    // Se pelo menos um item foi transferido com sucesso
    if (successCount > 0) {
      // Limpar o carrinho local
      localStorage.removeItem('cart');

      // Buscar o carrinho atualizado do servidor
      const updatedCart = await getCart();

      return {
        success: true,
        message: `${successCount} de ${localCart.items.length} itens sincronizados com sucesso`,
        cart: updatedCart,
      };
    }

    return {
      success: false,
      message: 'Não foi possível sincronizar nenhum item',
    };
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error);
    return { success: false, error: error.message };
  }
};
