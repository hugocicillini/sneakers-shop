import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { Cart } from '../models/cart.js';
import { Order } from '../models/order.js';
import logger from '../utils/logger.js';

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const createPreference = async (req, res, next) => {
  try {
    const { items, shippingInfo } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Itens não informados' });
    }

    const mpItems = items.map((item) => ({
      id: item._id || item.sneaker?._id || undefined,
      title: item.name,
      description: item.variant ? `${item.name} - ${item.variant}` : item.name,
      quantity: item.quantity,
      currency_id: 'BRL',
      unit_price: parseFloat(item.price),
      picture_url: item.image,
    }));
    const preferenceData = {
      items: mpItems,
      payer: {
        email: req.user.email,
      },
      notification_url: `${
        process.env.BACKEND_URL || 'http://localhost:5000'
      }/api/v1/payments/webhook`,
      shipments: shippingInfo?.cost
        ? {
            cost: parseFloat(shippingInfo.cost),
            mode: 'not_specified',
            receiver_address: {
              zip_code: shippingInfo.address?.zipcode,
              street_name: shippingInfo.address?.street,
              street_number: shippingInfo.address?.number,
              city_name: shippingInfo.address?.city,
              state_name: shippingInfo.address?.state,
              country_name: 'Brasil',
            },
          }
        : undefined,
      metadata: {
        user_id: userId.toString(),
      },
    };

    const preference = new Preference(mercadopago);
    const result = await preference.create({ body: preferenceData });

    res.status(200).json({
      success: true,
      preferenceId: result.id,
    });
  } catch (error) {
    logger.error(`Erro ao criar preference: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: 'Erro ao criar preference' });
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      preferenceId,
      cardToken,
      token,
      installments,
      paymentMethodId,
      payment_method_id,
      issuerId,
      issuer_id,
      identificationNumber,
      identificationType,
      payer,
    } = req.body;
    const userId = req.user._id;

    let order;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (preferenceId) {
      order = await Order.findOne({
        $or: [
          { 'paymentDetails.preferenceId': preferenceId },
          { preferenceId },
        ],
      });
    }

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Pedido não encontrado' });
    }

    if (order.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Acesso negado ao pedido' });
    }

    const finalCardToken = cardToken || token;
    const finalPaymentMethodId = paymentMethodId || payment_method_id;
    const finalIssuerId = issuerId || issuer_id;

    const finalIdentification = payer?.identification || {};
    const finalIdentificationType =
      identificationType || finalIdentification.type || 'CPF';
    const finalIdentificationNumber =
      identificationNumber || finalIdentification.number;
    const payerEmail = payer?.email || req.user.email;
    if (!finalPaymentMethodId) {
      logger.error('Payment method ID é obrigatório');
      return res
        .status(400)
        .json({ success: false, message: 'Método de pagamento obrigatório' });
    }

    if (!payerEmail || !req.user.email) {
      logger.error('Email do usuário é obrigatório');
      return res
        .status(400)
        .json({ success: false, message: 'Email do usuário é obrigatório' });
    }

    if (!order.total || isNaN(parseFloat(order.total))) {
      logger.error(`Total do pedido inválido: ${order.total}`);
      return res
        .status(400)
        .json({ success: false, message: 'Total do pedido inválido' });
    }
    const isPix = finalPaymentMethodId === 'pix';
    const isCard = ['visa', 'master', 'amex', 'elo', 'hipercard'].includes(
      finalPaymentMethodId.toLowerCase()
    );
    const isBoleto = [
      'bolbradesco',
      'boletobancario',
      'ticket',
      'pec',
      'paguefacil',
      'rapipago',
      'redlink',
    ].includes(finalPaymentMethodId.toLowerCase());

    function normalizePayerAddress(address) {
      const estados = {
        Acre: 'AC',
        Alagoas: 'AL',
        Amapá: 'AP',
        Amazonas: 'AM',
        Bahia: 'BA',
        Ceará: 'CE',
        'Distrito Federal': 'DF',
        'Espírito Santo': 'ES',
        Goiás: 'GO',
        Maranhão: 'MA',
        'Mato Grosso': 'MT',
        'Mato Grosso do Sul': 'MS',
        'Minas Gerais': 'MG',
        Pará: 'PA',
        Paraíba: 'PB',
        Paraná: 'PR',
        Pernambuco: 'PE',
        Piauí: 'PI',
        'Rio de Janeiro': 'RJ',
        'Rio Grande do Norte': 'RN',
        'Rio Grande do Sul': 'RS',
        Rondônia: 'RO',
        Roraima: 'RR',
        'Santa Catarina': 'SC',
        'São Paulo': 'SP',
        Sergipe: 'SE',
        Tocantins: 'TO',
      };

      return {
        ...address,
        federal_unit: estados[address.federal_unit] || address.federal_unit,
      };
    }
    const paymentData = {
      transaction_amount: parseFloat(order.total),
      description: `Pedido #${order.orderNumber} - Sneakers Shop`,
      payment_method_id: finalPaymentMethodId,
      payer: {
        email: payerEmail,
        first_name:
          payer?.first_name || req.user.name?.split(' ')[0] || 'Cliente',
        last_name:
          payer?.last_name ||
          req.user.name?.split(' ').slice(1).join(' ') ||
          'Cliente',
        identification: {
          type: finalIdentificationType,
          number: finalIdentificationNumber,
        },
        address:
          isBoleto && payer?.address
            ? normalizePayerAddress({
                zip_code: payer.address.zip_code,
                street_name: payer.address.street_name,
                street_number: payer.address.street_number,
                neighborhood: payer.address.neighborhood,
                city: payer.address.city,
                federal_unit: payer.address.federal_unit,
              })
            : undefined,
      },
      metadata: {
        order_id: order._id,
        user_id: userId.toString(),
        preference_id: preferenceId || order.preferenceId,
      },
    };

    if (isCard) {
      paymentData.token = finalCardToken;
      paymentData.issuer_id = finalIssuerId;
      paymentData.installments = parseInt(installments) || 1;
    }
    logger.info(
      `Processando pagamento do pedido ${order._id} via ${finalPaymentMethodId}`
    );

    const payment = new Payment(mercadopago);
    let paymentResult;

    try {
      paymentResult = await payment.create({ body: paymentData });
    } catch (mpError) {
      logger.error(`Erro da API MercadoPago: ${mpError.message}`);
      logger.error(`Dados enviados: ${JSON.stringify(paymentData, null, 2)}`);

      return res.status(400).json({
        success: false,
        message: 'Erro ao processar pagamento. Verifique os dados do cartão.',
        error: mpError.message,
      });
    }

    order.paymentStatus = paymentResult.status;
    order.paymentId = paymentResult.id;
    order.paymentDetails = {
      method: finalPaymentMethodId,
      lastDigits: paymentResult.card?.last_four_digits,
      installments: paymentResult.installments,
      preferenceId: preferenceId || order.preferenceId,
    };

    logger.info(
      `Pagamento criado com ID: ${paymentResult.id}, Status: ${paymentResult.status}`
    );

    if (paymentResult.status === 'pending') {
      logger.info(
        `Pagamento pendente para o pedido ${order._id}. Aguardando confirmação.`
      );

      const cart = await Cart.findOne({
        user: userId,
        status: 'active',
      });

      if (cart) {
        cart.status = 'converted';
        await cart.save();
        logger.info(
          `Carrinho ${cart._id} marcado como pendente após pagamento`
        );
      }
    }

    await order.save();

    if (isPix) {
      return res.status(200).json({
        success: true,
        message: 'Pagamento Pix criado com sucesso',
        data: {
          paymentId: paymentResult.id,
          status: paymentResult.status,
          orderId: order._id,
          orderNumber: order.orderNumber,
          pix: paymentResult.point_of_interaction?.transaction_data,
        },
      });
    }

    if (isBoleto) {
      return res.status(200).json({
        success: true,
        message: 'Pagamento por boleto criado com sucesso',
        data: {
          paymentId: paymentResult.id,
          status: paymentResult.status,
          orderId: order._id,
          orderNumber: order.orderNumber,
          boleto: {
            url: paymentResult.transaction_details.external_resource_url,
            barcode: paymentResult.barcode.content,
            expiration_date: paymentResult.date_of_expiration,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pagamento com cartão processado com sucesso',
      data: {
        paymentId: paymentResult.id,
        status: paymentResult.status,
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    logger.error(`Erro crítico ao processar pagamento: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    next(error);
  }
};

export const getPaymentInfo = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;

    logger.info(`Buscando informações do pagamento ${paymentId}`);

    const payment = new Payment(mercadopago);
    const paymentInfo = await payment.get({ id: paymentId });

    const order = await Order.findOne({ paymentId });

    if (order && order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este pagamento',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        paymentInfo,
        order: order
          ? {
              id: order._id,
              orderNumber: order.orderNumber,
              status: order.status,
              paymentStatus: order.paymentStatus,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error(`Erro ao buscar informações do pagamento: ${error.message}`);
    next(error);
  }
};

export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const { type, data } = req.body;

    logger.info(`Webhook recebido: ${JSON.stringify({ type, data })}`);

    if (type === 'payment') {
      const paymentId = data.id;

      const payment = new Payment(mercadopago);
      const paymentInfo = await payment.get({ id: paymentId });

      const order = await Order.findOne({
        paymentId: paymentInfo.id,
      });
      if (order) {
        order.paymentStatus = paymentInfo.status;
        if (paymentInfo.status === 'approved') {
          order.status = 'processing';
          logger.info(`Pagamento aprovado para pedido ${order._id}`);

          const userCart = await Cart.findOne({
            user: order.user,
            items: {
              $elemMatch: {
                sneaker: { $in: order.items.map((i) => i.sneaker) },
              },
            },
          });

          if (userCart && userCart.status === 'active') {
            userCart.status = 'converted';
            await userCart.save();
            logger.info(
              `Carrinho ${userCart._id} marcado como convertido após aprovação do pagamento`
            );
          }
        } else if (['rejected', 'cancelled'].includes(paymentInfo.status)) {
          order.status = 'cancelled';
          logger.info(
            `Pagamento ${paymentInfo.status} para pedido ${order._id}`
          );
        }

        await order.save();
      } else {
        logger.warn(`Ordem não encontrada para o pagamento ${paymentId}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`Erro ao processar webhook: ${error.message}`);
    res.status(200).json({ success: true });
  }
};
