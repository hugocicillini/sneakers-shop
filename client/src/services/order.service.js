import { getAuthHeaders } from "@/lib/utils";

/**
 * Cria um novo pedido com os dados do carrinho e endereço de entrega
 */
export const createOrder = async (orderData) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao criar pedido');
  }

  return await response.json();
};

/**
 * Busca um pedido específico por ID
 */
export const getOrderById = async (orderId) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar pedido');
  }

  return await response.json();
};

/**
 * Lista todos os pedidos do usuário
 */
export const getUserOrders = async (options = {}) => {
  const { page = 1, limit = 10, status } = options;

  let queryParams = new URLSearchParams({
    page,
    limit,
  });

  if (status) {
    queryParams.append('status', status);
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/user?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao listar pedidos');
  }

  return await response.json();
};

/**
 * Atualiza os dados de um pedido específico
 */
export const updateOrder = async (orderId, updateData) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao atualizar pedido');
  }

  return await response.json();
};

/**
 * Cancela um pedido específico
 */
export const cancelOrder = async (orderId, reason = '') => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao cancelar pedido');
  }

  return await response.json();
};
