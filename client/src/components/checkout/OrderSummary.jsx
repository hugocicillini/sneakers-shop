import { motion } from 'framer-motion';
import { CheckCircle, Package } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const OrderSummary = ({
  items,
  subtotal,
  shippingMethod,
  onContinue,
  onBack,
  disableContinue,
}) => {
  const shippingCost = shippingMethod?.price || 0;
  const totalWithShipping = parseFloat(subtotal) + shippingCost;
  const pixDiscount = totalWithShipping * 0.05;
  const totalWithPixDiscount = totalWithShipping - pixDiscount;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package size={18} className="text-primary" />
          Resumo do pedido
        </h2>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="flex gap-3 p-3 bg-gray-50 rounded-md"
            >
              <img
                src={item.image || 'https://via.placeholder.com/80'}
                alt={item.name}
                className="w-16 h-16 object-cover rounded border"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs h-5">
                    {item.size}
                  </Badge>
                  <span className="text-xs text-gray-500 capitalize">
                    {item.color}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                    Qtd: {item.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    <FormatCurrency value={item.price * item.quantity} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>
              Produtos ({items.length} {items.length === 1 ? 'item' : 'itens'})
            </span>
            <span>
              <FormatCurrency value={subtotal} />
            </span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            {shippingCost > 0 ? (
              <span>
                <FormatCurrency value={shippingCost} />
              </span>
            ) : (
              <span className="text-green-600 font-medium">GRÁTIS</span>
            )}
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>
              <FormatCurrency value={totalWithShipping} />
            </span>
          </div>
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <CheckCircle size={14} />
              Com Pix (5% off)
            </span>
            <span>
              <FormatCurrency value={totalWithPixDiscount} />
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Button
          className="w-full h-12 text-base font-medium rounded-full bg-black hover:bg-black/90 flex items-center justify-center gap-2"
          onClick={onContinue}
          disabled={disableContinue}
        >
          Continuar para o pagamento
        </Button>

        <Button
          variant="ghost"
          className="w-full mt-2 text-sm"
          onClick={onBack}
        >
          Voltar ao carrinho
        </Button>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
