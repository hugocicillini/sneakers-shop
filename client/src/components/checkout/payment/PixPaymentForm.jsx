import { Button } from '@/components/ui/button';
import {
  BadgeCheck,
  Clock,
  Info,
  ShieldCheck,
  Smartphone,
  Zap,
} from 'lucide-react';

const PixPaymentForm = ({ onSubmit, loading }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
        <div className="flex items-center gap-1">
          <ShieldCheck size={18} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            Pagamento seguro
          </span>
        </div>
      </div>

      {/* Destaque do desconto */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-lg border border-green-200 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800">
              5% de desconto no PIX
            </h3>
            <p className="text-sm text-green-700">Economize pagando com PIX</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <Info size={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 mb-1">
              Como funciona o pagamento PIX
            </p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Após clicar em "Gerar QR Code PIX", você receberá um código para
              escanear com seu aplicativo bancário. O pagamento é confirmado
              instantaneamente e seu pedido será processado em seguida.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-lg p-4 border flex flex-col items-center text-center">
          <Clock size={24} className="text-green-600 mb-2" />
          <h3 className="font-medium text-sm mb-1">Pagamento Instantâneo</h3>
          <p className="text-xs text-gray-500">Confirmação imediata</p>
        </div>

        <div className="bg-white rounded-lg p-4 border flex flex-col items-center text-center">
          <BadgeCheck size={24} className="text-green-600 mb-2" />
          <h3 className="font-medium text-sm mb-1">5% de Desconto</h3>
          <p className="text-xs text-gray-500">Economia garantida</p>
        </div>

        <div className="bg-white rounded-lg p-4 border flex flex-col items-center text-center">
          <Smartphone size={24} className="text-green-600 mb-2" />
          <h3 className="font-medium text-sm mb-1">Fácil e Rápido</h3>
          <p className="text-xs text-gray-500">Direto pelo celular</p>
        </div>

        <div className="bg-white rounded-lg p-4 border flex flex-col items-center text-center">
          <ShieldCheck size={24} className="text-green-600 mb-2" />
          <h3 className="font-medium text-sm mb-1">100% Seguro</h3>
          <p className="text-xs text-gray-500">Transação protegida</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border mt-6">
        <p className="text-xs text-gray-600 text-center">
          Ao clicar em "Gerar QR Code PIX", você concorda com nossos termos e
          condições de pagamento.
        </p>
      </div>

      <Button
        type="button"
        className="w-full h-12 text-base font-medium mt-4 bg-green-600 hover:bg-green-700"
        onClick={() => onSubmit()}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Processando pagamento...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Smartphone size={18} />
            <span>Gerar QR Code PIX</span>
          </div>
        )}
      </Button>
    </div>
  );
};

export default PixPaymentForm;
