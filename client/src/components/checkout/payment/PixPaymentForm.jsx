import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Info } from 'lucide-react';

const PixPaymentForm = ({ onSubmit, loading }) => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Pagamento via PIX</h2>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-blue-600" />
          <p className="text-sm text-blue-800 font-medium">Sobre o pagamento PIX</p>
        </div>
        <p className="text-sm text-blue-700">
          Ao continuar, você receberá um QR Code para realizar o pagamento via PIX.
          O pagamento é processado instantaneamente e você receberá a confirmação na hora.
        </p>
      </div>

      <div className="bg-green-50 p-4 rounded-md border border-green-200">
        <p className="text-sm text-green-700 font-medium">
          <span className="font-bold">Vantagens do PIX:</span>
        </p>
        <ul className="text-sm text-green-700 mt-2 list-disc list-inside">
          <li>Pagamento instantâneo</li>
          <li>5% de desconto</li>
          <li>Disponível 24 horas</li>
          <li>Sem taxas adicionais</li>
        </ul>
      </div>

      <Button 
        type="button"
        className="w-full" 
        onClick={() => onSubmit()}
        disabled={loading}
      >
        {loading ? 'Processando...' : 'Gerar QR Code PIX'}
      </Button>
    </div>
  );
};

export default PixPaymentForm;
