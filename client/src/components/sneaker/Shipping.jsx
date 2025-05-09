import { toast } from '@/hooks/use-toast';
import {
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const Delivery = () => {
  const [cep, setCep] = useState('');
  const [showShippingOptions, setShowShippingOptions] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('sedex');

  const handleCalculateShipping = () => {
    if (cep.replace(/\D/g, '').length < 8) {
      toast({
        title: 'CEP inválido',
        description: 'Digite um CEP válido para calcular o frete',
        variant: 'destructive',
      });
      return;
    }

    // Aqui você pode adicionar a lógica real de cálculo de frete
    setShowShippingOptions(true);
  };

  return (
    <div className="mt-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Cabeçalho com ícone de entrega */}
      <div className="p-4 bg-primary/5 border-b border-gray-200">
        <h3 className="font-semibold flex items-center">
          <TruckIcon size={18} className="mr-2 text-primary" />
          Entrega e Detalhes
        </h3>
      </div>

      {/* Container principal */}
      <div className="p-4">
        {/* Seção de Cálculo de Frete */}
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <MapPinIcon size={16} className="text-gray-500 mr-2" />
            <span className="text-sm font-medium">Calcular Frete e Prazo</span>
          </div>

          <div className="flex">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder="Digite seu CEP"
                className="rounded-r-none"
                maxLength={9}
                value={cep}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, '')
                    .replace(/(\d{5})(\d)/, '$1-$2')
                    .substring(0, 9);
                  setCep(value);
                }}
              />
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-block mt-1"
              >
                Não sei meu CEP
              </a>
            </div>
            <Button
              variant="default"
              className="rounded-l-none"
              onClick={handleCalculateShipping}
            >
              Calcular
            </Button>
          </div>

          {/* Opções de entrega */}
          {showShippingOptions && (
            <div className="mt-4 space-y-2 bg-white rounded-md p-2">
              <div className="text-xs text-gray-500 mb-2">
                Opções de frete para {cep}:
              </div>

              <label
                className={`flex justify-between items-center p-2 rounded-md transition-colors cursor-pointer ${
                  selectedShipping === 'pac'
                    ? 'bg-primary/5 border border-primary/20'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => setSelectedShipping('pac')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selectedShipping === 'pac'}
                    onChange={() => {}}
                    className="mr-2 accent-primary"
                  />
                  <div>
                    <div className="font-medium text-sm">PAC</div>
                    <div className="text-xs text-gray-500">
                      Até 7 dias úteis
                    </div>
                  </div>
                </div>
                <div className="font-medium text-sm">R$ 18,90</div>
              </label>

              <label
                className={`flex justify-between items-center p-2 rounded-md transition-colors cursor-pointer ${
                  selectedShipping === 'sedex'
                    ? 'bg-primary/5 border border-primary/20'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => setSelectedShipping('sedex')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selectedShipping === 'sedex'}
                    onChange={() => {}}
                    className="mr-2 accent-primary"
                  />
                  <div>
                    <div className="font-medium text-sm">SEDEX</div>
                    <div className="text-xs text-gray-500">
                      Até 3 dias úteis
                    </div>
                  </div>
                </div>
                <div className="font-medium text-sm">R$ 29,90</div>
              </label>
            </div>
          )}
        </div>

        {/* Divisor */}
        <div className="border-t border-dashed border-gray-200 my-4"></div>

        {/* Informações adicionais de entrega */}
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <PackageIcon size={16} className="text-gray-500 mr-2" />
            <span className="text-sm font-medium">Informações de Entrega</span>
          </div>
          <p className="text-xs text-gray-600 mb-1 pl-6">
            • Entrega grátis para compras acima de R$ 300,00
          </p>
          <p className="text-xs text-gray-600 pl-6">
            • Produtos despachados em até 24h após confirmação de pagamento
          </p>
        </div>

        {/* Garantias e benefícios */}
        <div>
          <div className="flex items-center mb-2">
            <ClockIcon size={16} className="text-gray-500 mr-2" />
            <span className="text-sm font-medium">Garantias e Segurança</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <div className="flex items-center">
              <CheckIcon
                size={14}
                className="text-green-500 mr-2 flex-shrink-0"
              />
              <span className="text-xs">Garantia de 30 dias</span>
            </div>
            <div className="flex items-center">
              <CheckIcon
                size={14}
                className="text-green-500 mr-2 flex-shrink-0"
              />
              <span className="text-xs">Entrega segura</span>
            </div>
            <div className="flex items-center">
              <CheckIcon
                size={14}
                className="text-green-500 mr-2 flex-shrink-0"
              />
              <span className="text-xs">Pagamento seguro</span>
            </div>
            <div className="flex items-center">
              <CheckIcon
                size={14}
                className="text-green-500 mr-2 flex-shrink-0"
              />
              <span className="text-xs">Troca facilitada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Delivery;
