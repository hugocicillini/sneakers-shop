import { getAuthHeaders } from '@/lib/utils';

export const createPaymentPreference = async (items, shippingInfo) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/payments/preference`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items, shippingInfo }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || 'Erro ao criar preferência de pagamento'
    );
  }

  return await response.json();
};

export const processPayment = async (paymentData) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/payments/payment`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao processar pagamento');
  }

  return await response.json();
};

export const getPaymentStatus = async (paymentId) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/payments/${paymentId}/status`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || 'Erro ao verificar status do pagamento'
    );
  }

  return await response.json();
};
