import BoletoPaymentForm from '@/components/checkout/payment/BoletoPaymentForm';
import CreditCardForm from '@/components/checkout/payment/CreditCardForm';
import PixPaymentForm from '@/components/checkout/payment/PixPaymentForm';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, CreditCard, QrCode, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Formato de moeda brasileiro
const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Hook para gerenciar métodos de pagamento
const usePaymentMethods = () => {
  const [selectedMethod, setSelectedMethod] = useState('credit_card');

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      icon: <CreditCard size={18} />,
      description: 'Pague em até 12x',
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: <QrCode size={18} />,
      description: '5% de desconto',
    },
    {
      id: 'boleto',
      name: 'Boleto',
      icon: <Receipt size={18} />,
      description: 'Prazo de 3 dias úteis',
    },
  ];

  return {
    selectedMethod,
    setSelectedMethod,
    paymentMethods,
  };
};

// Componente principal
const Payment = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { selectedMethod, setSelectedMethod, paymentMethods } =
    usePaymentMethods();
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [pixData, setPixData] = useState(null);
  const [boletoData, setBoletoData] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Verificar se o usuário está autenticado e tem itens no carrinho
  useEffect(() => {
    if (!isAuthenticated) {
      // Só redirecionar para login se user for undefined (ainda não carregou)
      if (user === undefined) {
        navigate('/login?redirect=/checkout/payment');
      }
      return;
    }

    // Recuperar informações de envio da sessão primeiro
    const storedShippingInfo = sessionStorage.getItem('shippingInfo');
    if (!storedShippingInfo) {
      navigate('/checkout/identification');
      return;
    }

    setShippingInfo(JSON.parse(storedShippingInfo)); // Verificação do carrinho com delay para dar tempo de carregar
    const checkCartTimer = setTimeout(() => {
      setLoadingCart(false);
      // Só verificamos o carrinho depois de um tempo para garantir que foi carregado
      // E apenas se não for uma sessão que já estava em andamento
      const inProgressOrder = sessionStorage.getItem('orderInProgress');
      if (items.length === 0 && !inProgressOrder) {
        navigate('/checkout/cart');
        return;
      }
    }, 1000);
    return () => clearTimeout(checkCartTimer);
  }, [isAuthenticated, navigate, items]);

  // Verificar se temos um pedido em andamento salvo na sessão
  useEffect(() => {
    const inProgressOrder = sessionStorage.getItem('orderInProgress');
    if (inProgressOrder) {
      try {
        const orderData = JSON.parse(inProgressOrder);
        setOrderId(orderData.orderId);

        // Se temos dados de PIX no sessionStorage, recuperar
        if (orderData.pixData) {
          setPixData(orderData.pixData);
        }

        // Se o pagamento foi marcado como completo
        if (orderData.completed) {
          setPaymentComplete(true);
        }
      } catch (error) {
        console.error('Erro ao processar pedido em andamento:', error);
      }
    }
  }, []);

  // Salvar estado do método de pagamento selecionado no sessionStorage
  useEffect(() => {
    if (selectedMethod) {
      sessionStorage.setItem('paymentMethod', selectedMethod);
    }
  }, [selectedMethod]);

  // Recuperar método de pagamento salvo anteriormente
  useEffect(() => {
    const savedMethod = sessionStorage.getItem('paymentMethod');
    if (savedMethod) {
      setSelectedMethod(savedMethod);
    }
  }, []);
  // Função para processar pagamento
  const handlePaymentSubmit = async (paymentData) => {
    console.log('handlePaymentSubmit chamado com:', paymentData);
  };

  // Se o pagamento foi concluído, limpar carrinho e redirecionar
  useEffect(() => {
    if (paymentComplete && orderId) {
      clearCart();
      sessionStorage.removeItem('orderInProgress');
      navigate(`/checkout/confirmation/${orderId}`);
    }
  }, [paymentComplete, orderId, navigate, clearCart]);

  // Só renderizar null se o usuário não estiver autenticado e o user for diferente de undefined
  // Se user for undefined, ainda está carregando o status de autenticação
  if (!isAuthenticated && user !== undefined) return null;

  // Mostra um estado de carregamento enquanto verificamos o carrinho ou os itens ainda não carregaram
  if (loadingCart || (!isAuthenticated && user === undefined) || !items) {
    return (
      <LayoutCheckout activeStep={3}>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando informações do pedido...</p>
          </div>
        </div>
      </LayoutCheckout>
    );
  }
  if (!shippingInfo) return null;
  // Calcular valores
  const shipping = shippingInfo?.cost || 0;
  const subtotalValue = parseFloat(subtotal) || 0;
  const pixDiscount = selectedMethod === 'pix' ? subtotalValue * 0.05 : 0;
  const total =
    subtotalValue + shipping - (selectedMethod === 'pix' ? pixDiscount : 0);

  // Componente com informações de entrega
  const ShippingInfoCard = ({ shippingInfo }) => (
    <div className="mt-4 bg-blue-50 p-4 rounded-lg">
      <h3 className="font-medium text-blue-700 mb-2">Informações de entrega</h3>
      {shippingInfo && shippingInfo.address && (
        <div className="text-sm space-y-1">
          <p className="font-medium">{shippingInfo.address.name}</p>
          <p>
            {shippingInfo.address.street}, {shippingInfo.address.number}
          </p>
          {shippingInfo.address.complement && (
            <p>{shippingInfo.address.complement}</p>
          )}
          <p>
            {shippingInfo.address.neighborhood} - {shippingInfo.address.city},{' '}
            {shippingInfo.address.state}
          </p>
          <p>{shippingInfo.address.zipCode}</p>
        </div>
      )}
      <Button
        variant="link"
        className="text-blue-700 p-0 h-auto mt-2"
        onClick={() => navigate('/checkout/identification')}
      >
        Alterar endereço
      </Button>
    </div>
  );

  // Componente de resumo do pedido simplificado
  const PaymentSummary = ({
    items,
    subtotal,
    shipping,
    pixDiscount,
    selectedMethod,
  }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <div className="font-semibold mb-3">Resumo da compra</div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span>
            Valor dos produtos ({items.length}{' '}
            {items.length === 1 ? 'item' : 'itens'})
          </span>
          <span>
            <FormatCurrency value={subtotal} />
          </span>
        </div>

        <div className="flex justify-between">
          <span>Frete</span>
          <span>
            {shipping === 0 ? (
              <span className="text-green-600 font-medium">Grátis</span>
            ) : (
              <FormatCurrency value={shipping} />
            )}
          </span>
        </div>

        {selectedMethod === 'pix' && (
          <div className="flex justify-between text-green-600 text-sm">
            <span className="flex items-center gap-1">
              <Check size={14} />
              Desconto Pix (5%)
            </span>
            <span>
              - <FormatCurrency value={pixDiscount} />
            </span>
          </div>
        )}

        <Separator className="my-2" />

        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>
            <FormatCurrency value={total} />
          </span>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-1">
          <Check size={12} className="text-green-500" />
          <span>Compra segura</span>
        </div>
        <div className="flex items-center gap-1">
          <Check size={12} className="text-green-500" />
          <span>Site criptografado</span>
        </div>
      </div>
    </div>
  );

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
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-xl font-bold">Forma de pagamento</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Tabs
                defaultValue={selectedMethod}
                onValueChange={setSelectedMethod}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 h-auto bg-gray-50 p-0 border-b">
                  {paymentMethods.map((method) => (
                    <TabsTrigger
                      key={method.id}
                      value={method.id}
                      className="flex flex-col items-center py-4 px-2 gap-1 data-[state=active]:bg-white rounded-none border-b-2 data-[state=active]:border-black data-[state=inactive]:border-transparent"
                    >
                      <div className="flex items-center gap-2">
                        {method.icon}
                        <span>{method.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {method.description}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="p-6">
                  <TabsContent value="credit_card" className="mt-0">
                    <CreditCardForm
                      onSubmit={(cardData) =>
                        handlePaymentSubmit({
                          ...cardData,
                          paymentMethod: 'credit_card',
                        })
                      }
                      loading={loading}
                    />
                  </TabsContent>{' '}
                  <TabsContent value="pix" className="mt-0">
                    <PixPaymentForm
                      onSubmit={() =>
                        handlePaymentSubmit({
                          paymentMethod: 'pix',
                        })
                      }
                      loading={loading}
                    />
                  </TabsContent>
                  <TabsContent value="boleto" className="mt-0">
                    <BoletoPaymentForm
                      onSubmit={() =>
                        handlePaymentSubmit({ paymentMethod: 'boleto' })
                      }
                      loading={loading}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          <div className="md:col-span-1">
            <PaymentSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              pixDiscount={pixDiscount}
              selectedMethod={selectedMethod}
            />

            <ShippingInfoCard shippingInfo={shippingInfo} />
          </div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Payment;
