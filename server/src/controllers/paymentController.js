import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { Order } from '../models/order.js';
import { Payment as PaymentModel } from '../models/payment.js';
import { User } from '../models/user.js';

// Configurar cliente do MercadoPago com suas credenciais
const client = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    'TEST-5930403879032710-050813-b13adc73197afafff9e52d597e20b73c-237806411',
});

// Definir se estamos usando credenciais de teste (starts with TEST-)
const IS_TEST_ENV =
  process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('TEST-') || true;

/**
 * Inicializa um checkout e prepara os dados para pagamento
 */
export const initializePayment = async (req, res) => {
  try {
    const { items, shippingInfo, subtotal } = req.body;
    const userId = req.user._id;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum item encontrado para gerar pagamento',
      });
    }

    // Busca informações do usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Garantir que o endereço existe
    const shippingAddress = shippingInfo?.address || user.defaultAddress;
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Endereço de entrega não encontrado',
      });
    }

    // Mapear corretamente os itens para formato compatível com Order
    const orderItems = items.map((item) => ({
      product: item.sneaker?._id || item.productId || item._id,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    }));

    // Criar pedido associado ao pagamento
    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: shippingAddress,
      shipping: {
        address: shippingAddress,
        method: shippingInfo?.method || 'standard',
        cost: shippingInfo?.cost || 0,
      },
      payment: {
        method: 'pending',
        status: 'pending',
      },
      status: 'pending',
      subtotal: parseFloat(subtotal),
      total: parseFloat(subtotal) + (shippingInfo?.cost || 0),
    });

    await order.save();

    // Preparar preferências para checkout do Mercado Pago
    // Dentro da função initializePayment, modifique o objeto preference:

    // Log para debug - vamos ver o que está acontecendo
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

    // Preferências do MercadoPago (substituindo a implementação atual)
    const preference = {
      items: items.map((item) => ({
        id: item.productId || item._id || 'item-id',
        title: item.name || 'Produto',
        description: `${item.name || 'Produto'} - Tamanho: ${
          item.size || 'único'
        }, Cor: ${item.color || 'padrão'}`,
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: parseFloat(item.price) || 0,
      })),
      payer: {
        name: user.name?.split(' ')[0] || 'Cliente',
        surname: user.name?.split(' ').slice(1).join(' ') || 'Teste',
        email: user.email || 'teste@email.com',
        phone: {
          area_code: '',
          number: user.phone || '11999999999',
        },
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
      },
      // URLs absolutas mais confiáveis
      back_urls: {
        success: 'http://localhost:5173/checkout/confirmation',
        failure: 'http://localhost:5173/checkout/payment',
        pending: 'http://localhost:5173/checkout/confirmation',
      },
      external_reference: order._id.toString(),
      // Usar o webhook fornecido pelo ngrok com caminho completo da API
      notification_url: 'https://b98d-2804-14d-5885-8fb0-88aa-371d-749f-8412.ngrok-free.app/api/v1/payments/webhook',
      statement_descriptor: 'SNEAKERS SHOP',
    };

    // Log para debug
    console.log('Preferências geradas:', {
      items: preference.items.length,
      back_urls: preference.back_urls,
      external_reference: preference.external_reference,
    });

    // Criar a preferência
    const preferenceClient = new Preference(client);
    const result = await preferenceClient.create({ body: preference });

    res.json({
      success: true,
      orderInfo: {
        id: order._id,
        total: order.total,
      },
      paymentData: {
        orderId: order._id,
        preferenceId: result.id,
        initPoint: result.init_point,
        publicKey:
          process.env.MERCADO_PAGO_PUBLIC_KEY ||
          'TEST-148e54bf-a842-4c7a-b303-cb6fdbfeece5',
        testMode: IS_TEST_ENV,
      },
    });
  } catch (error) {
    console.error('Erro ao inicializar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao inicializar o pagamento',
      error: error.message,
    });
  }
};

/**
 * Processa pagamento com cartão de crédito
 */
export const processCreditCardPayment = async (req, res) => {
  try {
    const {
      orderId,
      token,
      installments,
      paymentMethodId,
      identificationNumber,
      email,
      // Verificar se estamos em modo de teste
      isTestMode,
      // Extrair valores da transação de todas as possíveis fontes
      amount,
      transaction_amount,
      transactionAmount,
    } = req.body;
    const userId = req.user._id;

    // Log completo para diagnóstico
    console.log('Dados recebidos do cliente:', {
      orderId,
      hasToken: !!token,
      isTestMode,
      installments,
      paymentMethodId,
      amount,
      transaction_amount,
      transactionAmount,
    });

    // Buscar ordem
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pertence ao usuário logado
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado a este pedido',
      });
    }

    // Determinar o valor da transação - tentar todas as fontes possíveis
    let finalTransactionAmount = null;

    // Tentar obter valor do request body primeiro (prioridade para transaction_amount)
    if (transaction_amount !== undefined && transaction_amount !== null) {
      finalTransactionAmount = parseFloat(transaction_amount);
    } else if (transactionAmount !== undefined && transactionAmount !== null) {
      finalTransactionAmount = parseFloat(transactionAmount);
    } else if (amount !== undefined && amount !== null) {
      finalTransactionAmount = parseFloat(amount);
    }
    // Fallback para o valor do pedido
    else if (order.total) {
      finalTransactionAmount = parseFloat(order.total);
    }

    // Validação final - garantir que temos um número
    if (isNaN(finalTransactionAmount) || finalTransactionAmount <= 0) {
      console.error('Valor de transação inválido:', {
        finalTransactionAmount,
        orderTotal: order.total,
      });
      return res.status(400).json({
        success: false,
        message: 'Valor de transação inválido ou não informado',
      });
    }

    // Inicializar objeto payment se não existir
    if (!order.payment) {
      order.payment = {};
    }

    console.log('Valor final da transação:', finalTransactionAmount);

    // Verificar se estamos em modo de teste (sem token)
    if (isTestMode) {
      console.log('Processando em modo de teste (sem token)');

      // Simular pagamento aprovado em ambiente de teste
      const mockPaymentResponse = {
        id: `test_payment_${Date.now()}`,
        status: 'approved',
        status_detail: 'accredited',
        date_approved: new Date().toISOString(),
        payment_method_id: paymentMethodId,
        payment_type_id: 'credit_card',
        transaction_amount: finalTransactionAmount,
      };

      // Atualizar o status do pedido
      order.payment.method = 'credit_card';
      order.payment.status = 'approved';
      order.payment.transactionId = mockPaymentResponse.id;
      order.status = 'processing';
      await order.save();

      return res.json({
        success: true,
        data: {
          status: mockPaymentResponse.status,
          paymentId: mockPaymentResponse.id,
          testMode: true,
        },
      });
    }

    // Continuar com o processamento normal se não estiver em modo de teste
    const paymentClient = new Payment(client);
    const paymentData = {
      transaction_amount: finalTransactionAmount,
      token,
      description: `Pedido #${orderId}`,
      installments: parseInt(installments) || 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: email || req.user.email,
        identification: {
          type: 'CPF',
          number: identificationNumber || '12345678909', // CPF padrão para teste
        },
      },
      statement_descriptor: 'SNEAKERS SHOP',
      external_reference: orderId.toString(),
    };

    // Log completo do payload para diagnóstico
    console.log('Payload do Mercado Pago:', JSON.stringify(paymentData));

    const payment = await paymentClient.create({ body: paymentData });

    console.log('Resposta do Mercado Pago:', {
      status: payment.status,
      statusDetail: payment.status_detail,
      id: payment.id,
    });

    if (payment.status === 'approved') {
      // Atualizar o status do pedido
      order.payment.method = 'credit_card';
      order.payment.status = 'approved';
      order.payment.transactionId = payment.id;
      order.status = 'processing';
      await order.save();

      // Registrar o método de pagamento para uso futuro
      const cardPayment = new PaymentModel({
        user: userId,
        type: 'credit_card',
        cardDetails: {
          holderName: payment.card?.cardholder?.name || 'N/A',
          lastFourDigits: payment.card?.last_four_digits || 'XXXX',
          expiryMonth: payment.card?.expiration_month || 0,
          expiryYear: payment.card?.expiration_year || 0,
          brand: payment.card?.brand || 'N/A',
        },
        paymentToken: token,
      });
      await cardPayment.save();

      return res.json({
        success: true,
        data: {
          status: payment.status,
          paymentId: payment.id,
        },
      });
    } else {
      // Atualizar status para pagamento rejeitado
      order.payment.status = payment.status;
      order.status = 'payment_failed';
      await order.save();

      return res.json({
        success: false,
        message: `Pagamento ${payment.status}`,
        data: {
          status: payment.status,
          statusDetail: payment.status_detail,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar o pagamento',
      error: error.message,
    });
  }
};

/**
 * Gera pagamento por PIX
 */
export const generatePixPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user._id;

    // Buscar ordem
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pertence ao usuário logado
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado a este pedido',
      });
    }

    // Aplicar desconto de 5% para pagamento PIX
    const pixDiscount = order.total * 0.05;
    const totalWithDiscount = order.total - pixDiscount;

    // Inicializar objeto payment se não existir
    if (!order.payment) {
      order.payment = {};
    }

    const paymentClient = new Payment(client);
    const paymentData = {
      transaction_amount: totalWithDiscount,
      description: `Pedido #${orderId} - PIX`,
      payment_method_id: 'pix',
      payer: {
        email: req.user.email,
        first_name: req.user.name.split(' ')[0] || 'Cliente',
        last_name: req.user.name.split(' ').slice(1).join(' ') || 'Teste',
      },
      statement_descriptor: 'SNEAKERS SHOP',
      external_reference: orderId,
    };

    const payment = await paymentClient.create({ body: paymentData });

    if (payment.id) {
      // Atualizar o status do pedido
      order.payment.method = 'pix';
      order.payment.status = 'pending';
      order.payment.transactionId = payment.id;
      order.status = 'pending';
      order.total = totalWithDiscount; // Atualiza com desconto
      await order.save();

      res.json({
        success: true,
        data: {
          transactionId: payment.id,
          qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64:
            payment.point_of_interaction?.transaction_data?.qr_code_base64,
          expirationDate: payment.date_of_expiration,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Não foi possível gerar o pagamento PIX',
      });
    }
  } catch (error) {
    console.error('Erro ao gerar pagamento PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar o pagamento PIX',
      error: error.message,
    });
  }
};

/**
 * Gera boleto bancário
 */
export const generateBankSlip = async (req, res) => {
  try {
    const { orderId, taxId, fullName } = req.body;
    const userId = req.user._id;

    // Validar dados essenciais
    if (!taxId || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'CPF/CNPJ e nome completo são obrigatórios',
      });
    }

    // Buscar ordem
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pertence ao usuário logado
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado a este pedido',
      });
    }

    // Inicializar objeto payment se não existir
    if (!order.payment) {
      order.payment = {};
    }

    const paymentClient = new Payment(client);
    const paymentData = {
      transaction_amount: order.total,
      description: `Pedido #${orderId} - Boleto`,
      payment_method_id: 'bolbradesco',
      payer: {
        email: req.user.email,
        identification: {
          type: 'CPF',
          number: taxId.replace(/\D/g, ''), // Remove caracteres não numéricos
        },
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' '),
      },
      statement_descriptor: 'SNEAKERS SHOP',
      external_reference: orderId,
      // Data de expiração padrão: hoje + 3 dias úteis
      date_of_expiration: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    const payment = await paymentClient.create({ body: paymentData });

    if (payment.id) {
      // Atualizar o status do pedido
      order.payment.method = 'boleto';
      order.payment.status = 'pending';
      order.payment.transactionId = payment.id;
      order.status = 'pending';
      await order.save();

      res.json({
        success: true,
        data: {
          barcode: payment.barcode?.content,
          pdfUrl: payment.transaction_details?.external_resource_url,
          expirationDate: payment.date_of_expiration,
          amount: order.total,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Não foi possível gerar o boleto',
      });
    }
  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar o boleto bancário',
      error: error.message,
    });
  }
};

/**
 * Verifica o status de um pagamento
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;

    // Buscar pagamento no Mercado Pago
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    // Buscar order relacionada
    const orderId = payment.external_reference;
    const order = await Order.findById(orderId);

    // Verificar se o pedido existe e pertence ao usuário
    if (!order || order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado a este pagamento',
      });
    }

    // Atualizar status do pedido com base no status do pagamento
    if (payment.status !== order.payment.status) {
      order.payment.status = payment.status;

      // Atualizar status geral do pedido com base no status do pagamento
      if (payment.status === 'approved') {
        order.status = 'processing';
      } else if (
        payment.status === 'rejected' ||
        payment.status === 'cancelled'
      ) {
        order.status = 'payment_failed';
      }

      await order.save();
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        orderId: orderId,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do pagamento',
      error: error.message,
    });
  }
};

/**
 * Webhook para receber notificações do Mercado Pago
 * Este endpoint deve estar exposto publicamente
 */
export const webhookHandler = async (req, res) => {
  try {
    // Log completo do payload recebido para diagnóstico
    console.log('Webhook payload recebido:', JSON.stringify(req.body));
    
    const { type, data } = req.body;

    // Ignorar notificações que não sejam de pagamento
    if (type !== 'payment') {
      console.log(`Webhook: Ignorando notificação de tipo '${type}'`);
      return res.status(200).send();
    }

    console.log('Webhook de pagamento recebido:', {
      type,
      paymentId: data?.id,
    });

    // Validar se temos um ID de pagamento
    if (!data || !data.id) {
      console.warn('Webhook recebido sem ID de pagamento válido');
      return res.status(200).send(); // Responde com 200 OK para não repetir a notificação
    }

    try {
      // Buscar detalhes do pagamento no Mercado Pago
      const paymentId = data.id;
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });
      
      // Verificar se temos uma referência externa válida
      if (!payment.external_reference) {
        console.warn(`Webhook: Pagamento ${paymentId} sem referência externa válida`);
        return res.status(200).send();
      }

      // Buscar o pedido relacionado
      const orderId = payment.external_reference;
      const order = await Order.findById(orderId);

      if (!order) {
        console.error(`Webhook: Pedido ${orderId} não encontrado`);
        return res.status(200).send(); // Retornar 200 mesmo se o pedido não existir
      }

      // Inicializar objeto payment se não existir
      if (!order.payment) {
        order.payment = {};
      }

      // Atualizar status do pedido com base no status do pagamento
      order.payment.status = payment.status;
      order.payment.transactionId = payment.id;

      // Definir método de pagamento caso ainda não esteja definido
      if (order.payment.method === 'pending') {
        if (payment.payment_method_id === 'pix') {
          order.payment.method = 'pix';
        } else if (payment.payment_method_id.includes('card')) {
          order.payment.method = 'credit_card';
        } else if (payment.payment_method_id.includes('bol')) {
          order.payment.method = 'boleto';
        }
      }

      // Atualizar status geral do pedido
      if (payment.status === 'approved') {
        order.status = 'processing';
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        order.status = 'payment_failed';
      } else {
        order.status = 'pending';
      }

      await order.save();
      console.log(`Webhook: Status do pedido ${orderId} atualizado para ${order.status}`);
      
    } catch (paymentError) {
      // Capturar especificamente erros de "Payment not found"
      if (paymentError.status === 404 || paymentError.message?.includes('not found')) {
        console.warn(`Webhook: Pagamento ID ${data.id} não encontrado no Mercado Pago:`, paymentError);
        return res.status(200).send(); // Responder OK mesmo para pagamentos não encontrados
      }
      
      // Para outros erros, também responder OK mas logar o erro
      console.error('Erro ao processar webhook de pagamento:', paymentError);
      return res.status(200).send();
    }

    res.status(200).send();
    
  } catch (error) {
    // Capturar qualquer outro erro e evitar retornar 500
    console.error('Erro no webhook do Mercado Pago:', error);
    return res.status(200).send(); // Sempre retornar 200 para o Mercado Pago não tentar novamente
  }
};
