import OrderSummary from '@/components/checkout/OrderSummary';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { createOrder } from '@/services/order.service';
import {
  createPaymentPreference,
  processPayment,
} from '@/services/payment.service';
import { initMercadoPago, Payment as MP_Payment } from '@mercadopago/sdk-react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Payment = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    items,
    subtotal,
    clearCart,
    totalWithDiscounts,
    appliedCoupon,
    couponDiscount,
    calculatePixDiscount,
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout/payment');
      return;
    }

    if (items.length === 0) {
      navigate('/checkout/cart');
      return;
    }

    const storedShippingInfo = sessionStorage.getItem('shippingInfo');
    if (storedShippingInfo) {
      setShippingInfo(JSON.parse(storedShippingInfo));
    } else {
      navigate('/checkout/identification');
      return;
    }

    setLoading(false);
  }, [isAuthenticated, items, navigate]);

  useEffect(() => {
    initMercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY, {
      locale: 'pt-BR',
    });

    const fetchPreferenceIdAndCreateOrder = async () => {
      if (!shippingInfo || items.length === 0) return;
      setLoading(true);
      try {
        // 1. Solicita preferenceId ao backend usando service
        const prefData = await createPaymentPreference(items, shippingInfo);

        if (prefData.success && prefData.preferenceId) {
          setPreferenceId(prefData.preferenceId);

          // 2. Cria o pedido já com o preferenceId usando service
          const orderData = await createOrder({
            shippingAddress: shippingInfo.address,
            shippingMethod: shippingInfo.method,
            preferenceId: prefData.preferenceId,
          });

          if (orderData.success && orderData.data?.orderId) {
            setOrderId(orderData.data.orderId);
          } else {
            toast({
              title: 'Erro',
              description: 'Não foi possível criar o pedido.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Erro',
            description: 'Não foi possível obter o preferenceId do pagamento.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados de pagamento:', error);
        toast({
          title: 'Erro',
          description:
            error.message || 'Erro ao conectar com o servidor de pagamentos.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    };
    fetchPreferenceIdAndCreateOrder();
  }, [shippingInfo, items]);

  if (loading || !shippingInfo || !preferenceId) {
    return (
      <LayoutCheckout activeStep={3}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando sistema de pagamento...</p>
          </div>
        </div>
      </LayoutCheckout>
    );
  }

  const shippingMethod = {
    id: shippingInfo.method,
    name: shippingInfo.method === 'normal' ? 'PAC' : 'SEDEX',
    price: shippingInfo.cost || 0,
    isFreeShipping: shippingInfo.isFreeShipping || false,
  };

  const calculations = {
    subtotalValue: parseFloat(subtotal) || 0,
    couponDiscountValue: parseFloat(couponDiscount) || 0,
    shippingValue: shippingMethod.price || 0,

    get totalWithCoupon() {
      return this.subtotalValue - this.couponDiscountValue;
    },

    get totalForPayment() {
      return this.totalWithCoupon + this.shippingValue;
    },
  };

  const handlePaymentSubmit = async ({ selectedPaymentMethod, formData }) => {
    setProcessingOrder(true);
    const paymentData = {
      ...formData,
      paymentMethod: selectedPaymentMethod,
      preferenceId,
    };
    try {
      const result = await processPayment(paymentData);
      if (result.success) {
        clearCart();
        navigate(`/checkout/confirmation/${result.data.orderId || ''}`);
        return Promise.resolve();
      } else {
        toast({
          title: 'Erro no pagamento',
          description: result.message || 'Erro ao processar pagamento',
          variant: 'destructive',
        });
        setProcessingOrder(false);
        return Promise.reject();
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast({
        title: 'Erro no pagamento',
        description:
          error.message || 'Erro ao conectar com o servidor de pagamentos',
        variant: 'destructive',
      });
      setProcessingOrder(false);
      return Promise.reject();
    }
  };

  return (
    <LayoutCheckout activeStep={3}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-4 py-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/checkout/identification')}
            className="h-9 w-9"
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-xl font-bold">Finalizar Pagamento</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Escolha como pagar</h2>
              <MP_Payment
                initialization={{
                  amount: calculations.totalForPayment, // 🎯 Valor SEM desconto PIX
                  preferenceId,
                  payer: {
                    firstName: user?.name?.split(' ')[0] || '',
                    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                    email: user?.email || '',
                  },
                }}
                customization={{
                  paymentMethods: {
                    ticket: 'all',
                    bankTransfer: 'all',
                    creditCard: 'all',
                    prepaidCard: 'all',
                    debitCard: 'all',
                  },
                }}
                onSubmit={handlePaymentSubmit}
                onError={(error) => {
                  toast({
                    title: 'Erro no formulário de pagamento',
                    description:
                      'Ocorreu um erro ao carregar o formulário de pagamento',
                    variant: 'destructive',
                  });
                  setProcessingOrder(false);
                  setLoading(false);
                  console.log(error);
                }}
                onReady={() => {
                  setProcessingOrder(false);
                  setLoading(false);
                }}
              />
            </div>

            <div className="flex justify-center items-center gap-6 py-4 px-6 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <Lock size={20} className="text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">
                  Pagamento Seguro
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">
                  Ambiente Protegido
                </span>
              </div>
            </div>

            {/* 🎯 Endereço de entrega */}
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <MapPin size={16} />
                  Endereço de Entrega
                </h2>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate('/checkout/identification')}
                >
                  Editar
                </Button>
              </div>

              {shippingInfo.address && (
                <div className="text-sm space-y-1 text-gray-600">
                  <p className="font-medium text-gray-800">
                    {shippingInfo.address.name}
                  </p>
                  <p>
                    {shippingInfo.address.street}, {shippingInfo.address.number}
                    {shippingInfo.address.complement &&
                      ` - ${shippingInfo.address.complement}`}
                  </p>
                  <p>
                    {shippingInfo.address.neighborhood} -{' '}
                    {shippingInfo.address.city}, {shippingInfo.address.state}
                  </p>
                  <p>CEP: {shippingInfo.address.zipCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* 🎯 OrderSummary na lateral */}
          <div className="md:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingMethod={shippingMethod}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              calculatePixDiscount={calculatePixDiscount}
              onContinue={() => {}}
              onBack={() => navigate('/checkout/identification')}
              disableContinue={true}
              showBackButton={false}
              continueButtonText="Finalizar Pagamento"
              backButtonText="Voltar para dados"
              showItemsList={true}
              isPaymentPage={true}
            />
          </div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Payment;
