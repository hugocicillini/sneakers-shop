import { motion } from 'framer-motion';
import { Check, CheckCircle, Package } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const FormatCurrency = ({ value, className }) => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  return <span className={className}>{formatted}</span>;
};

const OrderSummary = ({
  items = [],
  subtotal = 0,
  shippingMethod = null,
  appliedCoupon = null,
  couponDiscount = 0,
  calculatePixDiscount = null,
  onContinue,
  onBack,
  disableContinue = false,
  continueButtonText = 'Continuar para pagamento',
  backButtonText = 'Voltar ao carrinho',
  showItemsList = true,
  isPaymentPage = false,
}) => {
  const calculations = {
    subtotalValue: parseFloat(subtotal) || 0,
    couponDiscountValue: parseFloat(couponDiscount) || 0,
    shippingValue: shippingMethod?.price || 0,

    get totalWithCoupon() {
      return this.subtotalValue - this.couponDiscountValue;
    },

    get totalWithShipping() {
      return this.totalWithCoupon + this.shippingValue;
    },

    get pixDiscountValue() {
      return calculatePixDiscount
        ? calculatePixDiscount(this.totalWithShipping)
        : 0;
    },

    get totalWithPix() {
      return this.totalWithShipping - this.pixDiscountValue;
    },
  };

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
          Resumo da compra
        </h2>

        {/* Lista de itens - opcional */}
        {showItemsList && (
          <>
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
                    <p className="font-medium text-sm line-clamp-1">
                      {item.name}
                    </p>
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
                        <FormatCurrency
                          value={
                            (item.originalPrice || item.price) * item.quantity
                          }
                        />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
          </>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>
              Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})
            </span>
            <span>
              <FormatCurrency value={calculations.subtotalValue} />
            </span>
          </div>

          {/* 🎯 Desconto do cupom */}
          {appliedCoupon && calculations.couponDiscountValue > 0 && (
            <div className="flex justify-between text-blue-600">
              <span className="flex items-center gap-1">
                <CheckCircle size={14} />
                Cupom {appliedCoupon.code}
                {appliedCoupon.discountType === 'percentage' && (
                  <span>({appliedCoupon.discountValue}%)</span>
                )}
              </span>
              <span className="font-medium">
                - <FormatCurrency value={calculations.couponDiscountValue} />
              </span>
            </div>
          )}

          {/* 🎯 Desconto PIX - comportamento diferente na página de pagamento */}
          {calculations.pixDiscountValue > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Check size={14} />
                Desconto PIX (5%)
              </span>
              <span>
                - <FormatCurrency value={calculations.pixDiscountValue} />
              </span>
            </div>
          )}

          {/* Frete */}
          {shippingMethod ? (
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <Package size={14} />
                Frete ({shippingMethod.name})
              </span>
              {calculations.shippingValue > 0 ? (
                <span>
                  <FormatCurrency value={calculations.shippingValue} />
                </span>
              ) : (
                <span className="text-green-600 font-medium">GRÁTIS</span>
              )}
            </div>
          ) : (
            <div className="flex justify-between">
              <span>Frete</span>
              <span className="text-gray-500">A calcular</span>
            </div>
          )}

          <Separator className="my-2" />

          {/* 🎯 Total - comportamento diferente na página de pagamento */}
          <div className="flex justify-between font-bold">
            <span>Total da compra</span>
            <span>
              <FormatCurrency value={calculations.totalWithShipping} />
            </span>
          </div>

          {/* 🎯 Total com PIX - só mostrar se não for página de pagamento */}
          {calculations.pixDiscountValue > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle size={14} />
                Total com PIX
              </span>
              <span>
                <FormatCurrency value={calculations.totalWithPix} />
              </span>
            </div>
          )}

          {/* 🆕 Economia com PIX */}
          {calculations.pixDiscountValue > 0 && isPaymentPage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 text-green-600 text-xs bg-green-50 p-2 rounded-md text-center"
            >
              💰 Economize{' '}
              <FormatCurrency
                value={calculations.pixDiscountValue}
                className="font-semibold"
              />{' '}
              pagando com <span className="font-semibold">PIX</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* 🎯 Botões - ocultos na página de pagamento */}
      {!isPaymentPage && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Button
            className="w-full h-12 text-base font-semibold rounded-full bg-black hover:bg-black/90"
            onClick={onContinue}
            disabled={disableContinue}
          >
            {continueButtonText}
          </Button>

          {/* Botão secundário */}
          <Button
            variant="ghost"
            className="w-full mt-2 text-sm"
            onClick={onBack}
          >
            {backButtonText}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default OrderSummary;
