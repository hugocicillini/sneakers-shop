import OrderSummary from '@/components/checkout/OrderSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { validateCoupon } from '@/services/coupon.service';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckIcon,
  HelpCircle,
  Loader2,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const QuantityControl = ({ quantity, onIncrease, onDecrease, disabled }) => (
  <div className="flex items-center border rounded shadow-sm">
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-none text-lg"
      onClick={onDecrease}
      disabled={quantity <= 1 || disabled}
    >
      -
    </Button>
    <span className="px-4 py-2 font-medium text-sm border-x w-12 text-center">
      {quantity}
    </span>
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-none text-lg"
      onClick={onIncrease}
      disabled={disabled}
    >
      +
    </Button>
  </div>
);

const CartItem = ({ item, updateQuantity, removeItem, loading }) => {
  const itemTotal = (
    (item.originalPrice || item.price) * item.quantity
  ).toFixed(2);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeItem(item.cartItemId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-12 px-6 py-4 items-center border-b hover:bg-gray-50/50 transition-colors"
    >
      <div className="col-span-12 sm:col-span-6 flex gap-4 items-center">
        <div className="w-24 h-24 rounded-lg border overflow-hidden bg-gray-50">
          <img
            src={item.image || '/placeholder-product.jpg'}
            alt={item.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm sm:text-base line-clamp-2">
            {item.name}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Cor:</span>
              <span className="capitalize">{item.color || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Tamanho:</span>
              <span>{item.size || 'N/A'}</span>
            </div>
            {item.brand && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Marca:</span>
                <span>{item.brand}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            disabled={isRemoving || loading}
            className="text-xs text-red-500 flex items-center mt-2 hover:text-red-700 transition-colors"
          >
            {isRemoving ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <Trash2 size={14} className="mr-1" />
            )}
            Remover
          </button>
        </div>
      </div>

      <div className="col-span-4 sm:col-span-2 mt-4 sm:mt-0 flex justify-start sm:justify-center items-center">
        <QuantityControl
          quantity={item.quantity}
          onIncrease={() => updateQuantity(item.cartItemId, item.quantity + 1)}
          onDecrease={() => updateQuantity(item.cartItemId, item.quantity - 1)}
          disabled={loading || isRemoving}
        />
      </div>

      <div className="col-span-4 sm:col-span-2 mt-4 sm:mt-0 text-left sm:text-center font-medium">
        <FormatCurrency value={item.originalPrice || item.price} />
      </div>

      <div className="col-span-4 sm:col-span-2 mt-4 sm:mt-0 text-right">
        <div className="font-bold text-base sm:text-lg">
          <FormatCurrency value={itemTotal} />
        </div>
        <div className="text-green-600 text-xs font-medium flex items-center justify-end gap-1">
          <Check size={12} />
          5% off no Pix
        </div>
      </div>
    </motion.div>
  );
};

const Cart = () => {
  const [coupon, setCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const [cep, setCep] = useState('');
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);

  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    applyCoupon,
    appliedCoupon,
    calculatePixDiscount,
    loading,
    couponDiscount,
  } = useCart();

  const navigate = useNavigate();

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const cartData = {
        cartTotal: parseFloat(subtotal),
        cartItems: items.map((item) => ({
          sneakerId: item.sneakerId,
          price: item.originalPrice || item.price,
          quantity: item.quantity,
          categoryId: item.categoryId,
        })),
      };

      const response = await validateCoupon(coupon, cartData);

      if (response.success) {
        applyCoupon(response.data);
        setCoupon('');
        toast({
          title: 'Cupom aplicado',
          description: `Desconto de ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(response.data.discountAmount)} aplicado à sua compra.`,
          variant: 'success',
        });
      } else {
        setCouponError(response.message || 'Cupom inválido');
        toast({
          title: 'Erro ao aplicar cupom',
          description: response.message || 'Este cupom não existe ou expirou',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setCouponError('Erro ao validar o cupom. Tente novamente.');
      toast({
        title: 'Erro',
        description: 'Não foi possível validar o cupom. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    applyCoupon(null);
    toast({
      title: 'Cupom removido',
      description: 'O cupom foi removido da sua compra.',
      variant: 'default',
    });
  };

  const handleContinue = () => {
    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos antes de continuar',
        variant: 'destructive',
      });
      return;
    }

    sessionStorage.setItem('allowIdentification', 'true');
    navigate('/checkout/identification');
  };

  const handleCalculateShipping = () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Por favor, informe um CEP válido',
        variant: 'destructive',
      });
      return;
    }

    setCalculatingShipping(true);

    setTimeout(() => {
      const subtotalValue = parseFloat(subtotal) || 0;
      const couponValue = parseFloat(couponDiscount) || 0;
      const totalWithCoupon = subtotalValue - couponValue;
      const isFreeShipping = totalWithCoupon >= 300;

      setShippingMethods([
        {
          id: 1,
          name: 'PAC',
          price: isFreeShipping ? 0 : 19.9,
          originalPrice: 19.9,
          days: '4-6 dias úteis',
          isFreeShipping: isFreeShipping,
        },
        {
          id: 2,
          name: 'SEDEX',
          price: 29.9,
          originalPrice: 29.9,
          days: '1-2 dias úteis',
          isFreeShipping: false,
        },
      ]);
      setSelectedShipping(1);
      setCalculatingShipping(false);

      toast({
        title: isFreeShipping ? 'Frete grátis disponível!' : 'Frete calculado',
        description: isFreeShipping
          ? 'Você ganhou frete grátis PAC para esta compra!'
          : 'Opções de entrega disponíveis',
        variant: 'default',
      });
    }, 1500);
  };

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Atualizar frete quando subtotal ou cupom mudam
  useEffect(() => {
    if (shippingMethods.length > 0 && selectedShipping) {
      const subtotalValue = parseFloat(subtotal) || 0;
      const couponValue = parseFloat(couponDiscount) || 0;
      const totalWithCoupon = subtotalValue - couponValue;
      const isFreeShipping = totalWithCoupon >= 300;

      setShippingMethods((prevMethods) =>
        prevMethods.map((method) => {
          if (method.id === 1) {
            return {
              ...method,
              price: isFreeShipping ? 0 : method.originalPrice,
              isFreeShipping,
            };
          }
          return method;
        })
      );
    }
  }, [subtotal, couponDiscount]);

  // 🎯 Criar objeto do método de frete selecionado para o OrderSummary
  const selectedShippingMethod = selectedShipping
    ? shippingMethods.find((m) => m.id === selectedShipping)
    : null;

  return (
    <LayoutCheckout activeStep={1}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-4 py-8"
      >
        {/* Banner de destaque */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-green-500 text-white p-2 rounded-full mr-3">
              <Check size={16} />
            </div>
            <span>
              Pague no Pix{' '}
              <span className="font-semibold text-green-700">
                e ganhe até 5% de desconto.
              </span>
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-green-700 underline text-sm font-medium">
                  Ver regras
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  O desconto de 5% é aplicado automaticamente para pagamentos
                  via PIX sobre o valor total da compra (produtos + frete -
                  cupons).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Tabela de produtos */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 px-6 py-4 border-b font-medium text-gray-700 text-sm bg-gray-50">
            <div className="col-span-6">Produtos</div>
            <div className="col-span-2 text-center">Quantidade</div>
            <div className="col-span-2 text-center">Valor unitário</div>
            <div className="col-span-2 text-right">Valor total</div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center">
              <Loader2 size={30} className="animate-spin mb-3 text-primary" />
              <p>Carregando itens do carrinho...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 text-gray-300 flex items-center justify-center border-2 border-dashed rounded-full">
                <X size={24} strokeWidth={1.5} />
              </div>
              <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                Continuar comprando
                <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {items.map((item) => (
                <CartItem
                  key={item.cartItemId}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  loading={loading}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Seções: Prazo, Cupom, OrderSummary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Prazo de entrega */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="font-semibold mb-3 flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              Prazo de entrega
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(formatCEP(e.target.value))}
                className="max-w-[130px] bg-gray-50"
                disabled={calculatingShipping}
              />
              <Button
                variant="outline"
                onClick={handleCalculateShipping}
                disabled={calculatingShipping || !cep}
                className="relative"
              >
                {calculatingShipping ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Calculando
                  </>
                ) : (
                  'Calcular'
                )}
              </Button>
            </div>

            <div className="mt-2 flex gap-2 flex-wrap">
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center"
              >
                <HelpCircle size={12} className="mr-1" />
                Não sei meu CEP
              </a>
              <Separator orientation="vertical" className="h-4" />
              <a href="#" className="text-xs text-gray-500 hover:underline">
                Ver política de frete
              </a>
            </div>

            {shippingMethods.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 mb-1">Opções para {cep}:</p>
                {shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border ${
                      selectedShipping === method.id
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedShipping === method.id}
                        onChange={() => setSelectedShipping(method.id)}
                        className="mr-2 accent-primary"
                      />
                      <div>
                        <span className="text-sm font-medium">
                          {method.name}
                        </span>
                        <p className="text-xs text-gray-500">{method.days}</p>
                      </div>
                    </div>
                    <span className="font-medium text-sm">
                      <FormatCurrency value={method.price} />
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Cupom de desconto */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="font-semibold mb-3">Cupom de desconto</div>
            {appliedCoupon ? (
              <div className="border border-green-200 bg-green-50 rounded-md p-3 mb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <CheckIcon size={16} className="text-green-600 mr-2" />
                      <span className="font-medium">{appliedCoupon.code}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {appliedCoupon.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    className="h-8 text-gray-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o cupom"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  disabled={!coupon.trim() || couponLoading}
                  onClick={handleValidateCoupon}
                >
                  {couponLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" />
                      Aplicando
                    </>
                  ) : (
                    'Aplicar'
                  )}
                </Button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-red-500 mt-1">{couponError}</p>
            )}
          </div>

          {/* 🎯 OrderSummary */}
          <div className="space-y-4">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingMethod={selectedShippingMethod}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              calculatePixDiscount={calculatePixDiscount}
              onContinue={handleContinue}
              onBack={() => navigate('/')}
              disableContinue={items.length === 0 || loading}
              showBackButton={false}
              showItemsList={false}
              continueButtonText="Continuar"
              backButtonText="Continuar comprando"
            />
          </div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Cart;
