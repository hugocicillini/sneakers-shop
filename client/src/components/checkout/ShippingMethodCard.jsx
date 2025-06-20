import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const FormatCurrency = ({ value }) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const ShippingMethodCard = ({ methods, selectedValue, onChange }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white p-6 rounded-lg shadow-sm border"
  >
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Truck size={18} className="text-primary" />
      Escolha o tipo de entrega
    </h2>

    <RadioGroup
      value={selectedValue}
      onValueChange={onChange}
      className="space-y-3"
    >
      {methods.map((method) => (
        <label
          key={method.id}
          htmlFor={method.id}
          className={cn(
            'flex items-center space-x-3 border rounded-lg p-2 px-4 cursor-pointer transition-all',
            method.id === selectedValue
              ? 'border-primary/50 bg-primary/5 shadow-sm'
              : 'hover:bg-gray-50'
          )}
          onClick={() => onChange(method.id)}
        >
          <RadioGroupItem
            value={method.id}
            id={method.id}
            className="text-primary"
          />
          <div className="flex justify-between items-center w-full">
            <div>
              <p className="font-medium">{method.name}</p>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
            <div className="text-right">
              {method.price > 0 ? (
                <span className="font-semibold">
                  <FormatCurrency value={method.price} />
                </span>
              ) : (
                <Badge
                  variant="success"
                  className="bg-green-100 text-green-700 hover:bg-green-200"
                >
                  GRÁTIS
                </Badge>
              )}
            </div>
          </div>
        </label>
      ))}
    </RadioGroup>

    <motion.div
      className="flex items-start mt-4 bg-blue-50 text-blue-700 p-3 rounded-md text-sm"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
    >
      <ShieldCheck size={16} className="mr-2 mt-0.5 flex-shrink-0" />
      <p>
        <span className="font-medium">Garantia de entrega:</span> Caso seu
        pedido não chegue no prazo estipulado, você pode solicitar seu dinheiro
        de volta.
      </p>
    </motion.div>
  </motion.div>
);

export default ShippingMethodCard;
