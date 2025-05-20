import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Calendar,
  FileText,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

const BoletoPaymentForm = ({ onSubmit, loading }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pagamento via Boleto</h2>
        <div className="flex items-center gap-1">
          <ShieldCheck size={18} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Pagamento seguro
          </span>
        </div>
      </div>

      {/* Instruções de Pagamento */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Receipt size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">
              Como pagar com boleto
            </h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal ml-4">
              <li>Gere o boleto clicando no botão abaixo</li>
              <li>
                Você receberá o boleto por e-mail e também poderá baixá-lo
              </li>
              <li>
                Pague até a data de vencimento em qualquer banco, casa lotérica
                ou internet banking
              </li>
              <li>
                Após o pagamento, aguarde a compensação bancária (até 3 dias
                úteis)
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 mb-1">
              Informações importantes
            </p>
            <ul className="text-sm text-amber-700 space-y-1.5 list-disc ml-4">
              <li>O boleto tem vencimento de 3 dias úteis</li>
              <li>
                Seu pedido será confirmado após a compensação do pagamento
              </li>
              <li>
                Produtos serão reservados por 3 dias ou até o vencimento do
                boleto
              </li>
              <li>
                Não é possível alterar a forma de pagamento após gerar o boleto
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vantagens em Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border flex flex-col items-center text-center">
          <FileText size={24} className="text-blue-600 mb-2" />
          <h3 className="font-medium text-sm mb-1">Sem Consultas</h3>
          <p className="text-xs text-gray-500">Não consulta SPC/Serasa</p>
        </div>

        <div className="bg-white rounded-lg p-4 border flex flex-col items-center text-center">
          <Calendar size={24} className="text-blue-600 mb-2" />
          <h3 className="font-medium text-sm mb-1">Prazo de Pagamento</h3>
          <p className="text-xs text-gray-500">Até 3 dias úteis</p>
        </div>
      </div>

      {/* Termos e Acordo */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <p className="text-xs text-gray-600 text-center">
          Ao clicar em "Gerar Boleto", você concorda com nossos termos e
          condições de pagamento.
        </p>
      </div>

      <Button
        type="button"
        className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
        onClick={() => onSubmit()}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Processando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Receipt size={18} />
            <span>Gerar Boleto Bancário</span>
          </div>
        )}
      </Button>
    </div>
  );
};

export default BoletoPaymentForm;
