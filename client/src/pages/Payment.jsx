import BoletoPaymentForm from '@/components/checkout/payment/BoletoPaymentForm';
import CreditCardForm from '@/components/checkout/payment/CreditCardForm';
import PixPaymentForm from '@/components/checkout/payment/PixPaymentForm';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  MapPin,
  QrCode,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Formato de moeda brasileiro
const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);

  // Métodos de pagamento
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      icon: <CreditCard size={18} />,
      description: 'Até 12x sem juros',
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
      description: 'Compensação em até 3 dias',
    },
  ];

  // Verificar autenticação e carregar dados
  useEffect(() => {
    if (!isAuthenticated) {
      if (user === undefined) {
        navigate('/login?redirect=/checkout/payment');
      }
      return;
    }

    // Recuperar informações de envio da sessão
    const storedShippingInfo = sessionStorage.getItem('shippingInfo');
    if (!storedShippingInfo) {
      navigate('/checkout/identification');
      return;
    }

    setShippingInfo(JSON.parse(storedShippingInfo));

    // Verificação do carrinho com delay
    const checkCartTimer = setTimeout(() => {
      setLoadingCart(false);
      if (items.length === 0) {
        navigate('/checkout/cart');
      }
    }, 1000);

    return () => clearTimeout(checkCartTimer);
  }, [isAuthenticated, navigate, items, user]);

  // Recuperar método de pagamento salvo
  useEffect(() => {
    const savedMethod = sessionStorage.getItem('paymentMethod');
    if (savedMethod) {
      setSelectedMethod(savedMethod);
    }
  }, []);

  // Salvar método selecionado
  useEffect(() => {
    if (selectedMethod) {
      sessionStorage.setItem('paymentMethod', selectedMethod);
    }
  }, [selectedMethod]);

  // Processar pagamento (simulação)
  const handlePaymentSubmit = async (paymentData) => {
    setLoading(true);

    try {
      // Simulando processamento de pagamento
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulando resposta de sucesso
      const orderId = 'ORDER' + Math.floor(Math.random() * 1000000);

      toast({
        title: 'Pedido realizado com sucesso!',
        description: `Seu pedido #${orderId} foi confirmado.`,
        variant: 'success',
      });

      // Limpar carrinho e redirecionar
      clearCart();
      navigate(`/checkout/confirmation/${orderId}`);
    } catch (error) {
      toast({
        title: 'Erro no processamento',
        description:
          'Ocorreu um erro ao processar seu pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tela de carregamento
  if (loadingCart || (!isAuthenticated && user === undefined) || !items) {
    return (
      <LayoutCheckout activeStep={3}>
        <div className="flex justify-center items-center min-h-[60vh]">
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
          <h1 className="text-xl font-bold">Finalizar Compra</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna principal - Métodos de pagamento */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
              <Tabs
                defaultValue={selectedMethod}
                onValueChange={setSelectedMethod}
                className="w-full"
              >
                {/* Cabeçalho das tabs */}
                <TabsList className="grid grid-cols-3 h-auto bg-gray-50 p-0 border-b">
                  {paymentMethods.map((method) => (
                    <TabsTrigger
                      key={method.id}
                      value={method.id}
                      className="flex flex-col items-center py-4 px-2 gap-1 data-[state=active]:bg-white rounded-none 
                        border-b-2 data-[state=active]:border-black data-[state=inactive]:border-transparent 
                        h-full transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {method.icon}
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {method.description}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Conteúdo das tabs */}
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
                  </TabsContent>

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

            {/* Selos de segurança */}
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

          {/* Coluna lateral - Resumo */}
          <div className="md:col-span-1 space-y-6">
            {/* Resumo do pedido */}
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <h2 className="font-semibold text-lg mb-4">Resumo do Pedido</h2>

              {/* Lista de produtos resumida */}
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

              {/* Valores */}
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
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">Grátis</span>
                    ) : (
                      <FormatCurrency value={shipping} />
                    )}
                  </span>
                </div>

                {selectedMethod === 'pix' && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto PIX (5%)</span>
                    <span>
                      - <FormatCurrency value={pixDiscount} />
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Total */}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  <FormatCurrency value={total} />
                </span>
              </div>
            </div>

            {/* Endereço de entrega */}
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <MapPin size={16} />
                  <span>Endereço de Entrega</span>
                </h2>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate('/checkout/identification')}
                >
                  Editar
                </Button>
              </div>

              {shippingInfo && shippingInfo.address && (
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

            {/* Prazo de entrega */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Check size={18} className="text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">
                    Prazo de entrega estimado
                  </p>
                  <p className="text-sm text-green-700">
                    {shippingInfo.method === 'normal'
                      ? 'De 4 a 6 dias úteis'
                      : 'De 1 a 2 dias úteis'}{' '}
                    após confirmação do pagamento
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Payment;
