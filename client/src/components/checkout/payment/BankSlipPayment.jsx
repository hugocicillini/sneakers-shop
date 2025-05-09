import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const BankSlipPayment = ({ onGenerateBankSlip, paymentData, processing }) => {
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState({
    taxId: '', // CPF/CNPJ
    fullName: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação básica
    if (!customerInfo.taxId || !customerInfo.fullName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos para gerar o boleto.',
        variant: 'destructive',
      });
      return;
    }

    // Chamar a função de gerar boleto
    onGenerateBankSlip(customerInfo);
  };

  const handleDownloadBoleto = () => {
    if (paymentData?.pdfUrl) {
      window.open(paymentData.pdfUrl, '_blank');
    }
  };

  const copyBarcode = async () => {
    if (!paymentData?.barcode) return;

    try {
      await navigator.clipboard.writeText(paymentData.barcode);
      toast({
        title: 'Copiado!',
        description: 'Código de barras copiado para a área de transferência',
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o código de barras',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 py-4">
      {!paymentData ? (
        <>
          <div className="text-center mb-6">
            <h3 className="font-medium text-lg mb-2">
              Pagamento com Boleto Bancário
            </h3>
            <p className="text-gray-600">
              Gere um boleto bancário e pague em qualquer banco ou lotérica.
              <br />
              <span className="text-sm">
                O prazo de compensação é de até 3 dias úteis.
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="taxId">CPF/CNPJ</Label>
              <Input
                id="taxId"
                name="taxId"
                value={customerInfo.taxId}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                required
                disabled={processing}
              />
            </div>

            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                name="fullName"
                value={customerInfo.fullName}
                onChange={handleInputChange}
                placeholder="Nome completo do pagador"
                required
                disabled={processing}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-black hover:bg-black/90"
              disabled={processing}
            >
              {processing ? 'Gerando boleto...' : 'Gerar Boleto'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center">
            <h3 className="font-medium text-lg mb-2">
              Boleto Gerado com Sucesso!
            </h3>
            <p className="text-gray-600">
              Seu boleto foi gerado com sucesso. Você pode baixá-lo ou copiar o
              código de barras.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Vencimento:{' '}
              {new Date(paymentData.expirationDate).toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Valor do Boleto</p>
                <p className="text-lg font-bold">
                  R$ {paymentData.amount?.toFixed(2)}
                </p>
              </div>

              <img
                src="/boleto-icon.png" // Substitua com o caminho real para seu ícone
                alt="Boleto"
                className="h-16 w-auto"
              />
            </div>
          </div>

          {/* Código de barras */}
          <div className="border p-3 rounded-lg">
            <p className="text-xs font-medium mb-1">Código de barras:</p>
            <div className="p-2 bg-gray-100 rounded text-xs break-all font-mono">
              {paymentData.barcode}
            </div>
            <Button
              onClick={copyBarcode}
              variant="outline"
              className="w-full mt-2 text-sm h-8"
            >
              Copiar código de barras
            </Button>
          </div>

          <Button
            onClick={handleDownloadBoleto}
            className="w-full h-12 rounded-full bg-black hover:bg-black/90"
          >
            Baixar Boleto
          </Button>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>
              Lembre-se: o prazo de compensação do boleto é de até 3 dias úteis.
              <br />
              Você receberá a confirmação por email após o pagamento.
            </p>
          </div>

          <div className="border-t w-full pt-4">
            <Button
              onClick={() => onGenerateBankSlip(customerInfo)}
              variant="ghost"
              className="w-full"
              disabled={processing}
            >
              Gerar novo boleto
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BankSlipPayment;
