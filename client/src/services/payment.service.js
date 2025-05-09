// Inicializa o checkout e retorna os dados para pagamento
export const initializePayment = async (paymentData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/payments/initialize`,
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    // Verificar se a resposta está ok antes de converter para JSON
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao inicializar pagamento');
    }

    // Converter resposta para JSON e retornar
    return await response.json();
  } catch (error) {
    console.error('Erro ao inicializar pagamento:', error);
    return {
      success: false,
      message: 'Não foi possível processar seu pagamento.',
    };
  }
};

// Processa pagamento com cartão de crédito
export const processCardPayment = async (cardData) => {
  try {
    // Garantir que usamos o CPF de teste para ambiente de desenvolvimento
    const CPF_TESTE = '12345678909';

    // Verificar se estamos no modo de teste sem token
    const isTestMode = cardData.useTestMode || !cardData.token;

    // Garantir que temos um valor de transação válido e convertê-lo para número
    let transactionAmount = null;

    // Métodos para obter o valor da transação, tentando todas as possibilidades
    if (typeof cardData.transaction_amount === 'number') {
      transactionAmount = cardData.transaction_amount;
    } else if (typeof cardData.transactionAmount === 'number') {
      transactionAmount = cardData.transactionAmount;
    } else if (typeof cardData.amount === 'number') {
      transactionAmount = cardData.amount;
    } else if (cardData.transaction_amount) {
      transactionAmount = parseFloat(
        String(cardData.transaction_amount).replace(/[^\d.]/g, '')
      );
    } else if (cardData.amount) {
      transactionAmount = parseFloat(
        String(cardData.amount).replace(/[^\d.]/g, '')
      );
    }

    console.log('Valor final da transação:', transactionAmount);

    // Estrutura de dados completa para o backend
    const paymentData = {
      transaction_amount: transactionAmount,
      // Enviar token apenas se não estiver em modo de teste
      ...(isTestMode ? {} : { token: cardData.token }),
      // Configurações de teste e webhook
      isTestMode,
      webhookUrl: 'https://b98d-2804-14d-5885-8fb0-88aa-371d-749f-8412.ngrok-free.app/api/v1/payments/webhook',
      description: `Pedido #${cardData.orderId}`,
      installments: Number(cardData.installments) || 1,
      payment_method_id: cardData.paymentMethodId,
      orderId: cardData.orderId,
      payer: {
        email: cardData.email || 'test@test.com',
        identification: {
          type: 'CPF',
          number: CPF_TESTE,
        },
      },
    };

    // Remover campos vazios ou undefined
    Object.keys(paymentData).forEach(
      (key) =>
        (paymentData[key] === undefined || paymentData[key] === '') &&
        delete paymentData[key]
    );

    console.log('Payload enviado para API:', JSON.stringify(paymentData));

    // Fazer a requisição ao backend
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/payments/credit-card`,
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    // Extrair resposta JSON
    const responseData = await response.json();
    console.log('Resposta do processamento de cartão:', responseData);

    // Verificar sucesso da resposta
    if (!response.ok) {
      throw new Error(
        responseData.message || 'Erro no processamento do cartão'
      );
    }

    return responseData;
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão:', error);
    return {
      success: false,
      message:
        error.message || 'Não foi possível processar seu pagamento com cartão.',
    };
  }
};

// Gera um pagamento PIX
export const generatePixPayment = async (orderId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/payments/pix`,
      {
        method: 'POST',
        body: JSON.stringify({ orderId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao gerar código PIX');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return { success: false, message: 'Não foi possível gerar o código PIX.' };
  }
};

// Gera um boleto
export const generateBankSlip = async (orderId, customerInfo) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/payments/bank-slip`,
      {
        method: 'POST',
        body: JSON.stringify({ orderId, ...customerInfo }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao gerar boleto');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    return { success: false, message: 'Não foi possível gerar o boleto.' };
  }
};

// Verifica status de um pagamento
export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/payments/status/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao verificar status');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return {
      success: false,
      message: 'Não foi possível verificar o status do pagamento.',
    };
  }
};
