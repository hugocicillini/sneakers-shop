import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BoletoPaymentForm = ({ onSubmit, loading }) => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Pagamento via Boleto</h2>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-blue-600" />
          <p className="text-sm text-blue-800 font-medium">Sobre o pagamento com boleto</p>
        </div>
        <p className="text-sm text-blue-700">
          Ao continuar, você receberá um boleto bancário para pagamento.
          O prazo para compensação do boleto é de até 3 dias úteis após o pagamento.
        </p>
      </div>

      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <span className="font-medium">Importante:</span> O boleto deve ser pago até a data de vencimento. 
          O não pagamento resulta no cancelamento automático do pedido após o vencimento.
        </p>
      </div>
      
      <Button 
        type="button"
        className="w-full" 
        onClick={() => onSubmit()}
        disabled={loading}
      >
        {loading ? 'Processando...' : 'Gerar Boleto'}
      </Button>
    </div>
  );
};

export default BoletoPaymentForm;
