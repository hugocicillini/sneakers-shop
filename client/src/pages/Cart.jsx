import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [coupon, setCoupon] = useState('');
  const [cep, setCep] = useState('');
  const [giftChecked, setGiftChecked] = useState(false);
  const { items, updateQuantity, removeItem, subtotal, cartCount, loading } =
    useCart();
  const navigate = useNavigate();

  // Calcular o valor do desconto do Pix (5%)
  const pixDiscount = parseFloat(subtotal) * 0.05;
  const totalWithPixDiscount = parseFloat(subtotal) - pixDiscount;

  // Função para continuar para o próximo passo - versão ultra simplificada
  const handleContinue = () => {
    // Marcar que o usuário pode acessar a página de identificação
    sessionStorage.setItem('allowIdentification', 'true');
    // Navegar normalmente
    navigate('/checkout/identification');
  };

  return (
    <LayoutCheckout activeStep={1}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Aviso Pix */}
        <div className="bg-[#f7f7f7] border border-green-200 rounded px-4 py-3 mb-6 flex items-center justify-between">
          <span>
            Pague no Pix{' '}
            <span className="font-semibold text-green-600">
              e ganhe até 5% de desconto.
            </span>
          </span>
          <a href="#" className="text-green-700 underline text-sm font-medium">
            Ver regras.
          </a>
        </div>

        {/* Tabela de produtos */}
        <div className="bg-white rounded shadow-sm mb-8">
          <div className="grid grid-cols-12 px-6 py-4 border-b font-medium text-gray-700 text-sm">
            <div className="col-span-6">Produtos</div>
            <div className="col-span-2 text-center">Quantidade</div>
            <div className="col-span-2 text-center">Valor unitário</div>
            <div className="col-span-2 text-right">Valor total</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Carregando itens do carrinho...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
              >
                Continuar comprando
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const itemTotal = (item.price * item.quantity).toFixed(2);

              return (
                <div
                  key={item.cartItemId}
                  className="grid grid-cols-12 px-6 py-4 items-center border-b"
                >
                  <div className="col-span-6 flex gap-4 items-center">
                    <img
                      src={item.image || 'https://via.placeholder.com/150'}
                      alt={item.name}
                      className="w-20 h-20 rounded object-cover border"
                    />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quantidade: {item.quantity}
                        <br />
                        Cor: {item.color || 'N/A'}
                        <br />
                        Tamanho: {item.size || 'N/A'}
                        <br />
                        {item.brand && `Marca: ${item.brand}`}
                      </div>
                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-xs text-red-500 flex items-center mt-2 hover:text-red-700"
                      >
                        <X size={14} className="mr-1" /> Remover
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <div className="flex items-center border rounded">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-lg"
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="px-3">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-lg"
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-medium">
                    R$ {item.price.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="font-bold text-lg">R$ {itemTotal}</div>
                    <div className="text-green-600 text-xs font-medium">
                      +5% off no Pix
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Seções: Prazo, Cupom, Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Prazo de entrega */}
          <div>
            <div className="font-semibold mb-2">Prazo de entrega</div>
            <div className="flex gap-2">
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="max-w-[120px]"
              />
              <Button variant="outline">Calcular</Button>
            </div>
            <div className="mt-2">
              <a href="#" className="text-xs text-gray-500 underline">
                Confira a nossa Política de Frete e Entregas.
              </a>
              <span className="mx-1 text-xs text-gray-400">|</span>
              <a href="#" className="text-xs text-gray-500 underline">
                Não sei o CEP
              </a>
            </div>
          </div>

          {/* Cupom de desconto */}
          <div>
            <div className="font-semibold mb-2">Cupom de desconto</div>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o cupom"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <Button variant="outline">Aplicar</Button>
            </div>
            <div className="flex items-center mt-2">
              <Checkbox
                id="gift"
                checked={giftChecked}
                onCheckedChange={setGiftChecked}
                className="mr-2"
              />
              <label htmlFor="gift" className="text-xs text-gray-600">
                Tem um vale-troca ou cartão presente?
              </label>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Você poderá usá-los na etapa de pagamento.
            </div>
          </div>

          {/* Resumo */}
          <div>
            <div className="font-semibold mb-2">Resumo</div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>
                  Valor dos produtos ({cartCount}{' '}
                  {cartCount === 1 ? 'item' : 'itens'})
                </span>
                <span>R$ {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span className="text-gray-500">A calcular</span>
              </div>
              {parseFloat(subtotal) > 0 && (
                <div className="flex justify-between text-green-600 text-sm mt-1">
                  <span>Desconto Pix (5%)</span>
                  <span>- R$ {pixDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-2">
                <span>Total da compra</span>
                <span>R$ {subtotal}</span>
              </div>
              {parseFloat(subtotal) > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Com Pix</span>
                  <span>R$ {totalWithPixDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <Button
              className="w-full mt-6 h-12 text-base font-semibold rounded-full bg-black hover:bg-black/90"
              onClick={handleContinue}
              disabled={items.length === 0 || loading}
            >
              {items.length === 0 ? 'Carrinho vazio' : 'Continuar'}
            </Button>
            {items.length > 0 && (
              <Button
                variant="link"
                className="w-full mt-2 text-sm"
                onClick={() => (window.location.href = '/')}
              >
                Continuar comprando
              </Button>
            )}
          </div>
        </div>
      </div>
    </LayoutCheckout>
  );
};

export default Cart;
