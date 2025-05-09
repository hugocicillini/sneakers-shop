import OrderSummary from '@/components/checkout/OrderSummary';
import BankSlipPayment from '@/components/checkout/payment/BankSlipPayment';
import CreditCardForm from '@/components/checkout/payment/CreditCardForm';
import PixPayment from '@/components/checkout/payment/PixPayment';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import {
  checkPaymentStatus,
  generateBankSlip,
  generatePixPayment,
  initializePayment,
  processCardPayment,
} from '@/services/payment.service';
import { CreditCard, QrCode, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hook para gerenciar o estado do pagamento
const usePaymentState = (clearCart, navigate) => {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [processing, setProcessing] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Estados específicos para PIX
  const [pixData, setPixData] = useState(null);
  const [checkingPixStatus, setCheckingPixStatus] = useState(false);

  // Inicialização do pedido
  const initializeOrder = useCallback(
    async (items, subtotal) => {
      try {
        const shippingInfo = JSON.parse(
          sessionStorage.getItem('shippingInfo') || '{}'
        );

        const response = await initializePayment({
          items,
          shippingInfo,
          subtotal,
        });

        if (response.success) {
          setOrderInfo(response.orderInfo);
          setPaymentData(response.paymentData);
          return true;
        } else {
          toast({
            title: 'Erro',
            description:
              response.message || 'Não foi possível iniciar o pagamento',
            variant: 'destructive',
          });
          navigate('/checkout/identification');
          return false;
        }
      } catch (error) {
        console.error('Erro ao inicializar pagamento:', error);
        toast({
          title: 'Erro de conexão',
          description: 'Não foi possível se conectar ao servidor de pagamento',
          variant: 'destructive',
        });
        return false;
      }
    },
    [navigate]
  );

  // Direcionar para a confirmação após pagamento bem-sucedido
  const handlePaymentSuccess = useCallback(
    (responseData, method) => {
      // Armazenar dados para a página de confirmação
      sessionStorage.setItem(
        'paymentResult',
        JSON.stringify({
          ...responseData,
          orderId: orderInfo.id,
          paymentMethod: method,
        })
      );

      // Limpar carrinho e navegar para a página de confirmação
      clearCart();
      navigate('/checkout/confirmation');
    },
    [clearCart, navigate, orderInfo]
  );

  return {
    paymentMethod,
    setPaymentMethod,
    processing,
    setProcessing,
    orderInfo,
    paymentData,
    pixData,
    setPixData,
    checkingPixStatus,
    setCheckingPixStatus,
    initializeOrder,
    handlePaymentSuccess,
  };
};

// Hook específico para pagamentos PIX
const usePixPayment = (
  orderInfo,
  setProcessing,
  setPixData,
  setCheckingPixStatus,
  handlePaymentSuccess
) => {
  // Gerar código PIX
  const handleGeneratePixCode = useCallback(async () => {
    if (!orderInfo) return;

    setProcessing(true);
    try {
      const response = await generatePixPayment(orderInfo.id);

      if (response.success) {
        setPixData(response.data);
        toast({
          title: 'Código PIX gerado',
          description: 'Escaneie o QR code com o app do seu banco para pagar.',
        });
      } else {
        toast({
          title: 'Erro ao gerar PIX',
          description: response.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao gerar código PIX:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o código PIX',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }, [orderInfo, setProcessing, setPixData]);

  // Verificar status do pagamento PIX
  const handleCheckPixStatus = useCallback(
    async (pixData) => {
      if (!pixData?.transactionId) {
        toast({
          title: 'Erro',
          description: 'Informações de pagamento não encontradas',
          variant: 'destructive',
        });
        return;
      }

      setCheckingPixStatus(true);
      try {
        const response = await checkPaymentStatus(pixData.transactionId);

        if (response.success) {
          if (response.data.status === 'approved') {
            toast({
              title: 'Pagamento confirmado!',
              description: 'Seu pagamento foi processado com sucesso.',
            });

            handlePaymentSuccess(response.data, 'pix');
          } else {
            toast({
              title: 'Pagamento pendente',
              description:
                'Ainda não identificamos seu pagamento. Tente novamente em alguns instantes.',
              variant: 'warning',
            });
          }
        } else {
          toast({
            title: 'Erro',
            description: response.message || 'Erro ao verificar pagamento',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível verificar o status do pagamento',
          variant: 'destructive',
        });
      } finally {
        setCheckingPixStatus(false);
      }
    },
    [setCheckingPixStatus, handlePaymentSuccess]
  );

  return {
    handleGeneratePixCode,
    handleCheckPixStatus,
  };
};

// Hook para lidar com pagamentos de cartão e boleto
const useOtherPayments = (orderInfo, setProcessing, handlePaymentSuccess) => {
  const handleCardPayment = useCallback(
    async (paymentDetails) => {
      if (!orderInfo) return;

      // Formatação do número de identificação - remover caracteres não numéricos
      if (paymentDetails.identificationNumber) {
        paymentDetails.identificationNumber =
          paymentDetails.identificationNumber.replace(/\D/g, '');
      }

      // Garantir que temos um valor numérico para o total
      const totalAmount = orderInfo.total
        ? parseFloat(String(orderInfo.total).replace(/[^\d.]/g, ''))
        : 100.0;

      // Adicionar flag de teste para indicar ambiente de desenvolvimento sem webhook
      const isTestEnvironment = true; // Em produção, mudar para false

      console.log('Dados do cartão formatados:', {
        ...paymentDetails,
        token: paymentDetails.token ? 'TOKEN_PRESENT' : 'NO_TOKEN',
        identificationNumber: paymentDetails.identificationNumber || 'VAZIO',
        amount: totalAmount,
        testEnvironment: isTestEnvironment,
      });

      // Validar CPF/CNPJ
      if (
        !paymentDetails.identificationNumber ||
        paymentDetails.identificationNumber.length < 11
      ) {
        toast({
          title: 'CPF/CNPJ inválido',
          description: 'Por favor, informe um número de documento válido.',
          variant: 'destructive',
        });
        return;
      }

      setProcessing(true);
      try {
        const response = await processCardPayment({
          orderId: orderInfo.id,
          // Passar o valor em múltiplos formatos para garantir compatibilidade
          amount: totalAmount,
          transaction_amount: totalAmount,
          transactionAmount: totalAmount,
          // Indicar explicitamente que estamos em ambiente sem webhook configurado
          useTestMode: isTestEnvironment,
          skipWebhookValidation: true,
          ...paymentDetails,
        });

        if (response.success) {
          handlePaymentSuccess(response.data, 'credit-card');
        } else {
          toast({
            title: 'Erro no pagamento',
            description: response.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao processar pagamento com cartão:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível processar seu pagamento com cartão',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
    },
    [orderInfo, setProcessing, handlePaymentSuccess]
  );

  const handleBankSlipPayment = useCallback(
    async (customerInfo) => {
      if (!orderInfo) return;

      setProcessing(true);
      try {
        const response = await generateBankSlip(orderInfo.id, customerInfo);

        if (response.success) {
          handlePaymentSuccess(response.data, 'bank-slip');
        } else {
          toast({
            title: 'Erro ao gerar boleto',
            description: response.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao gerar boleto:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o boleto bancário',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
    },
    [orderInfo, setProcessing, handlePaymentSuccess]
  );

  return {
    handleCardPayment,
    handleBankSlipPayment,
  };
};

// Componente de seleção de método de pagamento
const PaymentMethodSelection = ({ value, onChange }) => {
  const paymentMethods = [
    {
      id: 'credit-card',
      title: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo, etc.',
      icon: <CreditCard className="mr-2 h-5 w-5 text-primary" />,
    },
    {
      id: 'pix',
      title: 'Pix',
      description: '5% de desconto',
      icon: <QrCode className="mr-2 h-5 w-5 text-primary" />,
      badge: <Badge className="ml-2 bg-green-100 text-green-700">-5%</Badge>,
    },
    {
      id: 'bank-slip',
      title: 'Boleto Bancário',
      description: 'Pagamento em até 3 dias úteis',
      icon: <Receipt className="mr-2 h-5 w-5 text-primary" />,
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold mb-4">Forma de pagamento</h2>

        <RadioGroup
          value={value}
          onValueChange={onChange}
          className="space-y-4"
        >
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                value === method.id ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <RadioGroupItem value={method.id} id={method.id} />
              <label
                htmlFor={method.id}
                className="flex-1 cursor-pointer flex items-center"
              >
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {method.icon}
                    {method.title}
                    {method.badge}
                  </div>
                  <div className="text-sm text-gray-500">
                    {method.description}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

// Componente principal da página
const Payment = () => {
  const { isAuthenticated, user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Gerenciamento de estado do pagamento usando nossos hooks customizados
  const {
    paymentMethod,
    setPaymentMethod,
    processing,
    setProcessing,
    orderInfo,
    paymentData,
    pixData,
    setPixData,
    checkingPixStatus,
    setCheckingPixStatus,
    initializeOrder,
    handlePaymentSuccess,
  } = usePaymentState(clearCart, navigate);

  // Hook de pagamento PIX
  const { handleGeneratePixCode, handleCheckPixStatus } = usePixPayment(
    orderInfo,
    setProcessing,
    setPixData,
    setCheckingPixStatus,
    handlePaymentSuccess
  );

  // Hook para outros pagamentos
  const { handleCardPayment, handleBankSlipPayment } = useOtherPayments(
    orderInfo,
    setProcessing,
    handlePaymentSuccess
  );

  // Inicializar dados do pedido
  useEffect(() => {
    // Verificar se o usuário está logado
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout/payment');
      return;
    }

    // Verificar se há itens no carrinho
    if (items.length === 0) {
      navigate('/checkout/cart');
      return;
    }

    initializeOrder(items, subtotal);
  }, [isAuthenticated, items, subtotal, navigate, initializeOrder]);

  // Se não estiver autenticado ou não houver itens, não renderiza
  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  return (
    <LayoutCheckout activeStep={3}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Seleção de método de pagamento */}
            <PaymentMethodSelection
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            {/* Formulário específico do método de pagamento */}
            <Card>
              <CardContent className="pt-6">
                {paymentMethod === 'credit-card' && (
                  <CreditCardForm
                    onSubmit={handleCardPayment}
                    processing={processing}
                  />
                )}

                {paymentMethod === 'pix' && (
                  <PixPayment
                    onGenerateCode={handleGeneratePixCode}
                    onVerifyPayment={() => handleCheckPixStatus(pixData)}
                    pixData={pixData}
                    processing={processing}
                    checkingStatus={checkingPixStatus}
                  />
                )}

                {paymentMethod === 'bank-slip' && (
                  <BankSlipPayment
                    onGenerateBankSlip={handleBankSlipPayment}
                    paymentData={paymentData?.bankSlip}
                    processing={processing}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo do pedido (coluna à direita) */}
          <div className="md:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingInfo={JSON.parse(
                sessionStorage.getItem('shippingInfo') || '{}'
              )}
              paymentMethod={paymentMethod}
              disableContinue={true} // Botão de continuar desabilitado, pois os componentes de pagamento têm seus próprios botões
            />
          </div>
        </div>
      </div>
    </LayoutCheckout>
  );
};

export default Payment;
