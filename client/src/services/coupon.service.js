export const validateCoupon = async (code, cartData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons/code/${code}/validate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
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

export const redeemCoupon = async (code, orderId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons/code/${code}/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ orderId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erro ao aplicar cupom ao pedido',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao aplicar cupom:', error);
    return {
      success: false,
      message: 'Erro de conexão ao aplicar cupom',
    };
  }
};

export const getCouponByCode = async (code) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons/code/${code}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Cupom não encontrado',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    return {
      success: false,
      message: 'Erro de conexão ao buscar cupom',
    };
  }
};

// Para uso administrativo - requer autenticação de admin
export const getCoupons = async (filters = {}) => {
  try {
    // Construir query string a partir dos filtros
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erro ao buscar cupons',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao listar cupons:', error);
    return {
      success: false,
      message: 'Erro de conexão ao listar cupons',
    };
  }
};

export const createCoupon = async (couponData) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(couponData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erro ao criar cupom',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    return {
      success: false,
      message: 'Erro de conexão ao criar cupom',
    };
  }
};

export const updateCoupon = async (couponId, couponData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons/${couponId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(couponData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erro ao atualizar cupom',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    return {
      success: false,
      message: 'Erro de conexão ao atualizar cupom',
    };
  }
};

export const deleteCoupon = async (couponId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/coupons/${couponId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Erro ao excluir cupom',
      };
    }

    return data;
  } catch (error) {
    console.error('Erro ao excluir cupom:', error);
    return {
      success: false,
      message: 'Erro de conexão ao excluir cupom',
    };
  }
};
