import { getAuthHeaders } from '@/lib/utils';

export const validateCoupon = async (code, cartData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons/code/${code}/validate`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cartData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Cupom inválido ou expirado',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return {
      success: false,
      message: 'Erro de conexão ao validar cupom',
    };
  }
};
