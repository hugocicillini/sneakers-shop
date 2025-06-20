import { getAuthHeaders } from '@/lib/utils';

export const createOrder = async (orderData) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao criar pedido');
  }

  return await response.json();
};

export const getOrderById = async (orderId) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar pedido');
  }

  return await response.json();
};

export const getUserOrders = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (status && status !== 'all') {
      queryParams.append('status', status);
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/orders/user?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      switch (response.status) {
        case 401:
          throw new Error('Sessão expirada. Faça login novamente.');
        case 403:
          throw new Error('Acesso negado.');
        case 404:
          throw new Error('Pedidos não encontrados.');
        case 500:
          throw new Error('Erro interno do servidor. Tente novamente.');
        default:
          throw new Error(
            errorData.message ||
              `Erro ${response.status}: Falha ao carregar pedidos`
          );
      }
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Formato de resposta inválido');
    }

    return data;
  } catch (error) {
    console.error('Erro no getUserOrders:', {
      message: error.message,
      options,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};

export const updateOrder = async (orderId, updateData) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao atualizar pedido');
  }

  return await response.json();
};

export const cancelOrder = async (orderId, reason = '') => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao cancelar pedido');
  }

  return await response.json();
};
