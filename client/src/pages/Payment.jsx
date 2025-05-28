import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { initMercadoPago, Payment as MP_Payment } from '@mercadopago/sdk-react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Formata valores para Real brasileiro
const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const Payment = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotal, clearCart, totalWithDiscounts } = useCart();

  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);

  // Verifica autenticação, carrinho e carrega endereço
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

  // Busca preferenceId do backend
  useEffect(() => {
    // Inicializa MercadoPago apenas uma vez (v1.x)
    initMercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY, {
      locale: 'pt-BR',
    });

    const fetchPreferenceIdAndCreateOrder = async () => {
      if (!shippingInfo || items.length === 0) return;
      setLoading(true);
      try {
        // 1. Solicita preferenceId ao backend
        const prefRes = await fetch(
          `${import.meta.env.VITE_API_URL}/payments/preference`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ items, shippingInfo }),
          }
        );
        const prefData = await prefRes.json();
        if (prefData.success && prefData.preferenceId) {
          setPreferenceId(prefData.preferenceId);
          // 2. Cria o pedido já com o preferenceId
          const orderRes = await fetch(
            `${import.meta.env.VITE_API_URL}/orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                shippingAddress: shippingInfo.address,
                shippingMethod: shippingInfo.method,
                preferenceId: prefData.preferenceId,
              }),
            }
          );
          const orderData = await orderRes.json();
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
        toast({
          title: 'Erro',
          description: 'Erro ao conectar com o servidor de pagamentos.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    };
    fetchPreferenceIdAndCreateOrder();
    // eslint-disable-next-line
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

  const shippingCost = shippingInfo?.cost || 0;
  const total = parseFloat(totalWithDiscounts) + parseFloat(shippingCost);

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
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Escolha como pagar</h2>
              <MP_Payment
                initialization={{
                  amount: total,
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
                onSubmit={async ({ selectedPaymentMethod, formData }) => {
                  setProcessingOrder(true);
                  const paymentData = {
                    ...formData,
                    paymentMethod: selectedPaymentMethod,
                    preferenceId,
                  };
                  try {
                    const res = await fetch(
                      `${import.meta.env.VITE_API_URL}/payments/card`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem(
                            'token'
                          )}`,
                        },
                        body: JSON.stringify(paymentData),
                      }
                    );
                    const result = await res.json();
                    console.log('Payment result:', result);
                    if (result.success) {
                      clearCart();
                      navigate(
                        `/checkout/confirmation/${result.data.orderId || ''}`
                      );
                      return Promise.resolve();
                    } else {
                      toast({
                        title: 'Erro no pagamento',
                        description:
                          result.message || 'Erro ao processar pagamento',
                        variant: 'destructive',
                      });
                      setProcessingOrder(false);
                      return Promise.reject();
                    }
                  } catch {
                    toast({
                      title: 'Erro no pagamento',
                      description:
                        'Erro ao conectar com o servidor de pagamentos',
                      variant: 'destructive',
                    });
                    setProcessingOrder(false);
                    return Promise.reject();
                  }
                }}
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

            <div className="mt-6 flex justify-center items-center gap-6 py-4 px-6 bg-white rounded-lg border">
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
          </div>

          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <h2 className="font-semibold text-lg mb-4">Resumo da compra</h2>

              <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden border flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tam: {item.size} | Cor: {item.color || 'N/A'}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                          Qtd: {item.quantity}
                        </p>
                        <p className="text-sm font-medium">
                          <FormatCurrency value={item.price * item.quantity} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    Subtotal ({items.length}{' '}
                    {items.length === 1 ? 'item' : 'itens'})
                  </span>
                  <span>
                    <FormatCurrency value={subtotal} />
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    {shippingInfo.isFreeShipping ? (
                      <span className="text-green-600 font-medium">Grátis</span>
                    ) : (
                      <FormatCurrency value={shippingCost} />
                    )}
                  </span>
                </div>

                {subtotal > totalWithDiscounts && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>
                      - <FormatCurrency value={subtotal - totalWithDiscounts} />
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  <FormatCurrency value={total} />
                </span>
              </div>
            </div>

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
                  <p>CEP: {shippingInfo.address.zipcode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Payment;
