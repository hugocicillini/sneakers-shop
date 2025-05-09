import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Componente para exibir o número formatado
const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Componente de contador de quantidade
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

// Componente do item do carrinho
const CartItem = ({ item, updateQuantity, removeItem, loading }) => {
  const itemTotal = (item.price * item.quantity).toFixed(2);
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
        <FormatCurrency value={item.price} />
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
  const [cep, setCep] = useState('');
  const [giftChecked, setGiftChecked] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);

  const { items, updateQuantity, removeItem, subtotal, cartCount, loading } =
    useCart();

  const navigate = useNavigate();

  // Calcular o valor do desconto do Pix (5%)
  const pixDiscount = parseFloat(subtotal) * 0.05;
  const totalWithPixDiscount = parseFloat(subtotal) - pixDiscount;

  // Função para continuar para o próximo passo
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

    // Simulação de API de frete
    setTimeout(() => {
      setShippingMethods([
        { id: 1, name: 'PAC', price: 19.9, days: '4-6 dias úteis' },
        { id: 2, name: 'SEDEX', price: 29.9, days: '1-2 dias úteis' },
      ]);
      setSelectedShipping(1);
      setCalculatingShipping(false);

      toast({
        title: 'Frete calculado',
        description: 'Opções de entrega disponíveis',
        variant: 'default',
      });
    }, 1500);
  };

  // Formatar CEP durante digitação
  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

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
                  via PIX.
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

        {/* Seções: Prazo, Cupom, Resumo */}
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
            <div className="flex gap-2">
              <Input
                placeholder="Digite o cupom"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                disabled={!coupon.trim()}
                onClick={() => {
                  toast({
                    title: 'Cupom inválido',
                    description: 'Este cupom não existe ou expirou',
                    variant: 'destructive',
                  });
                }}
              >
                Aplicar
              </Button>
            </div>

            <div className="flex items-start mt-4">
              <Checkbox
                id="gift"
                checked={giftChecked}
                onCheckedChange={setGiftChecked}
                className="mt-1 mr-2"
              />
              <div>
                <label
                  htmlFor="gift"
                  className="text-sm text-gray-800 cursor-pointer"
                >
                  Tem um vale-troca ou cartão presente?
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Você poderá usá-los na etapa de pagamento.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="font-semibold mb-3">Resumo da compra</div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>
                  Valor dos produtos ({cartCount}{' '}
                  {cartCount === 1 ? 'item' : 'itens'})
                </span>
                <span>
                  <FormatCurrency value={subtotal} />
                </span>
              </div>

              {selectedShipping && (
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <span>
                      Frete (
                      {
                        shippingMethods.find((m) => m.id === selectedShipping)
                          ?.name
                      }
                      )
                    </span>
                    {parseFloat(subtotal) >= 300 && (
                      <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Grátis
                      </span>
                    )}
                  </span>
                  <span>
                    {parseFloat(subtotal) >= 300 ? (
                      <FormatCurrency value={0} />
                    ) : (
                      <FormatCurrency
                        value={
                          shippingMethods.find((m) => m.id === selectedShipping)
                            ?.price || 0
                        }
                      />
                    )}
                  </span>
                </div>
              )}

              {!selectedShipping && (
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span className="text-gray-500">A calcular</span>
                </div>
              )}

              {parseFloat(subtotal) > 0 && (
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
                <span>Total da compra</span>
                <span>
                  <FormatCurrency
                    value={
                      parseFloat(subtotal) +
                      (selectedShipping && parseFloat(subtotal) < 300
                        ? shippingMethods.find((m) => m.id === selectedShipping)
                            ?.price || 0
                        : 0)
                    }
                  />
                </span>
              </div>

              {parseFloat(subtotal) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Total com Pix</span>
                  <span>
                    <FormatCurrency
                      value={
                        totalWithPixDiscount +
                        (selectedShipping && parseFloat(subtotal) < 300
                          ? shippingMethods.find(
                              (m) => m.id === selectedShipping
                            )?.price || 0
                          : 0)
                      }
                    />
                  </span>
                </div>
              )}

              {selectedShipping &&
                parseFloat(subtotal) >=
                  import.meta.env.VITE_FREE_SHIPPING_PRICE && (
                  <div className="mt-2 text-green-600 text-sm font-medium flex items-center gap-1 bg-green-50 p-2 rounded-md">
                    <CheckIcon size={16} className="mr-1" />
                    Você ganhou frete grátis!
                  </div>
                )}
            </div>

            <Button
              className="w-full mt-6 h-12 text-base font-semibold rounded-full bg-black hover:bg-black/90"
              onClick={handleContinue}
              disabled={items.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Processando
                </>
              ) : items.length === 0 ? (
                'Carrinho vazio'
              ) : (
                'Continuar'
              )}
            </Button>

            {items.length > 0 && (
              <Button
                variant="link"
                className="w-full mt-2 text-sm"
                onClick={() => navigate('/')}
              >
                Continuar comprando
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Cart;
