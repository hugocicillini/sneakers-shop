// Serviço para manipulação do carrinho de compras
// Implementa chamadas à API e usa localStorage como fallback

// Helper para verificar se o usuário está autenticado
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Helper para obter os headers com autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  
  // Adicionar log para debug
  console.log('Token encontrado:', token ? 'Sim' : 'Não');
  if (token) {
    console.log('Primeiros 20 caracteres do token:', token.substring(0, 20) + '...');
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Helper para verificar e processar respostas da API
const processApiResponse = async (response) => {
  // Verificar se a resposta é JSON antes de tentar processá-la
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    // Se não for JSON, obter o texto para informações de depuração
    const text = await response.text();
    console.error('Resposta não-JSON recebida:', text);
    throw new Error('Resposta inválida do servidor');
  }
};

export const getCart = async () => {
  try {
    if (isAuthenticated()) {
      console.log('Buscando carrinho para usuário autenticado');

      // Log para debug
      console.log('URL da API:', `${import.meta.env.VITE_API_URL}/cart`);
      console.log(
        'Token:',
        localStorage.getItem('token').substring(0, 20) + '...'
      );

      // Buscar carrinho do servidor para usuários autenticados
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart`, {
        method: 'GET',
        headers: getAuthHeaders()
        // Removido credentials: 'include'
      });

      // Log para debug
      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', [...response.headers.entries()]);

      if (!response.ok) {
        if (response.status === 401) {
          // Se não autorizado, poderia tentar renovar o token ou fazer logout
          console.error('Usuário não autorizado. Verifique a autenticação.');
          // Falha silenciosa e usa localStorage
          return await getCartFromLocalStorage();
        }

        // Outros erros
        const errorText = await response.text();
        console.error('Erro ao buscar carrinho:', errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const data = await processApiResponse(response);
      console.log('Dados do carrinho recebidos:', data);

      // Se o servidor retorna o carrinho em um formato diferente, ajustamos aqui
      return data.cart || data;
    } else {
      // Fallback para localStorage para usuários não autenticados
      return new Promise((resolve) => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            resolve(JSON.parse(savedCart));
          } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            resolve({ items: [] });
          }
        } else {
          resolve({ items: [] });
        }
      });
    }
  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    // Em caso de erro na API, tentar carregar do localStorage
    return getCartFromLocalStorage();
  }
};

// Função auxiliar para carregar do localStorage
const getCartFromLocalStorage = () => {
  return new Promise((resolve) => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        resolve(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
        resolve({ items: [] });
      }
    } else {
      resolve({ items: [] });
    }
  });
};

export const addToCart = async (item) => {
  try {
    if (isAuthenticated()) {
      // Garantir que sneakerId e variantId estejam presentes e formatados corretamente
      const payload = {
        sneakerId: item.sneakerId,
        variantId: item.variantId,
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color,
        name: item.name,
        price: item.price,
        image: item.image,
        brand: item.brand,
        slug: item.slug
      };

      // Obter headers com autenticação
      const headers = getAuthHeaders();
      console.log('Enviando headers:', headers);

      console.log('Enviando dados para a API:', JSON.stringify(payload, null, 2));
      
      // Adicionar ao carrinho no servidor para usuários autenticados
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      // Log para debug
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        // Tentar obter o corpo da resposta de erro
        let errorBody = {};
        try {
          errorBody = await response.json();
        } catch (e) {
          const errorText = await response.text();
          console.error('Corpo da resposta de erro (texto):', errorText);
          throw new Error(`Erro ${response.status}: Não foi possível processar a resposta`);
        }
        
        console.error('Corpo da resposta de erro:', errorBody);
        throw new Error(errorBody.message || `Erro ${response.status}: Falha ao adicionar item`);
      }
      
      const result = await processApiResponse(response);
      console.log('Resposta do servidor (carrinho):', result);
      return result;
    } else {
      // Fallback para localStorage para usuários não autenticados
      const cart = await getCartFromLocalStorage();

      // Verifica se o item já existe no carrinho
      const existingItemIndex = cart.items.findIndex(
        (cartItem) =>
          cartItem.sneakerId === item.sneakerId &&
          cartItem.size === item.size &&
          cartItem.color === item.color
      );

      let updatedItem;

      if (existingItemIndex >= 0) {
        // Item já existe no carrinho
        const existingItem = cart.items[existingItemIndex];

        // CORREÇÃO: Somar a nova quantidade à quantidade existente
        // Assim, mesmo após recarregar a página, a quantidade será mantida
        const combinedQuantity = existingItem.quantity + item.quantity;

        // Para debugging
        console.log('Item existente:', existingItem);
        console.log('Quantidade existente:', existingItem.quantity);
        console.log('Nova quantidade a adicionar:', item.quantity);
        console.log('Quantidade combinada:', combinedQuantity);

        // Atualiza o item existente SOMANDO a quantidade
        updatedItem = {
          ...existingItem,
          quantity: combinedQuantity,
        };

        cart.items[existingItemIndex] = updatedItem;
      } else {
        // Gera ID único apenas para novos itens
        const cartItemId = `${item.sneakerId}-${item.size}-${
          item.color
        }-${Date.now()}`;
        // Adiciona novo item ao carrinho
        updatedItem = { ...item, cartItemId };
        cart.items.push(updatedItem);
      }

      // Salva o carrinho atualizado
      localStorage.setItem('cart', JSON.stringify(cart));

      return { success: true, cart, item: updatedItem };
    }
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error);
    return { 
      success: false, 
      error: error.message,
      item: item // Retorna o item original para debugging
    };
  }
};

export const removeFromCart = async (cartItemId) => {
  try {
    if (isAuthenticated()) {
      // Remover do carrinho no servidor para usuários autenticados
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cart/${cartItemId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao remover item do carrinho no servidor');
      }

      return await response.json();
    } else {
      // Fallback para localStorage para usuários não autenticados
      const cart = await getCartFromLocalStorage();

      // Remove o item do carrinho
      const updatedItems = cart.items.filter(
        (item) => item.cartItemId !== cartItemId
      );

      const updatedCart = { ...cart, items: updatedItems };

      // Salva o carrinho atualizado
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      return { success: true, cart: updatedCart };
    }
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error);
    return { success: false, error: error.message };
  }
};

export const updateCartItemQuantity = async (cartItemId, quantity) => {
  try {
    if (quantity < 1) {
      throw new Error('Quantidade deve ser pelo menos 1');
    }

    if (isAuthenticated()) {
      // Atualizar quantidade no servidor para usuários autenticados
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cart/${cartItemId}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ quantity }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao atualizar quantidade no servidor');
      }

      return await response.json();
    } else {
      // Fallback para localStorage para usuários não autenticados
      const cart = await getCartFromLocalStorage();

      // Encontra e atualiza o item
      const updatedItems = cart.items.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );

      const updatedCart = { ...cart, items: updatedItems };

      // Salva o carrinho atualizado
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      return { success: true, cart: updatedCart };
    }
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    return { success: false, error: error.message };
  }
};

export const clearCart = async () => {
  try {
    if (isAuthenticated()) {
      // Limpar carrinho no servidor para usuários autenticados
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar carrinho no servidor');
      }

      // Também limpar localStorage para sincronizar
      localStorage.removeItem('cart');
      return await response.json();
    } else {
      // Fallback para localStorage para usuários não autenticados
      localStorage.setItem('cart', JSON.stringify({ items: [] }));

      return { success: true, cart: { items: [] } };
    }
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    return { success: false, error: error.message };
  }
};

export const syncCart = async (cartData) => {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cartData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao sincronizar carrinho');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error);
    return { success: false, error: error.message };
  }
};
