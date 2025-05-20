import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const CreditCardForm = ({ onSubmit, loading }) => {
  const { toast } = useToast();
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationMonth: '',
    expirationYear: '',
    securityCode: '',
    cpf: '',
    installments: '1',
  });

  // Gerar anos para expiração
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  // Gerar opções de parcelas
  const installmentOptions = [
    { value: '1', label: '1x de R$ 360,00 sem juros' },
    { value: '2', label: '2x de R$ 180,00 sem juros' },
    { value: '3', label: '3x de R$ 120,00 sem juros' },
    { value: '4', label: '4x de R$ 90,00 sem juros' },
    { value: '5', label: '5x de R$ 72,00 sem juros' },
    { value: '6', label: '6x de R$ 60,00 sem juros' },
    { value: '7', label: '7x de R$ 51,42 sem juros' },
    { value: '8', label: '8x de R$ 45,00 sem juros' },
    { value: '9', label: '9x de R$ 40,00 sem juros' },
    { value: '10', label: '10x de R$ 36,00 sem juros' },
  ];

  // Formatação de cartão
  const formatCardNumber = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim()
      .substring(0, 19);
  };

  // Formatação de CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'cardNumber') {
      setCardData({ ...cardData, [name]: formatCardNumber(value) });
    } else if (name === 'cpf') {
      setCardData({ ...cardData, [name]: formatCPF(value) });
    } else {
      setCardData({ ...cardData, [name]: value });
    }
  };

  const handleSelectChange = (name, value) => {
    setCardData({ ...cardData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação básica - poderia ser mais robusta
    if (
      !cardData.cardNumber ||
      !cardData.cardholderName ||
      !cardData.expirationMonth ||
      !cardData.expirationYear ||
      !cardData.securityCode ||
      !cardData.cpf
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos do cartão',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(cardData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Cartão de Crédito</h2>
        <div className="flex items-center gap-1">
          <ShieldCheck size={18} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            Pagamento seguro
          </span>
        </div>
      </div>

      {/* Bandeiras de cartão */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center">
          <span className="text-xs font-medium">VISA</span>
        </div>
        <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center">
          <span className="text-xs font-medium">MC</span>
        </div>
        <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center">
          <span className="text-xs font-medium">ELO</span>
        </div>
        <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center">
          <span className="text-xs font-medium">AMEX</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber" className="text-sm font-medium">
              Número do Cartão
            </Label>
            <div className="relative">
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardData.cardNumber}
                onChange={handleChange}
                className="pl-10"
                maxLength={19}
              />
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <div>
            <Label htmlFor="cardholderName" className="text-sm font-medium">
              Nome Impresso no Cartão
            </Label>
            <Input
              id="cardholderName"
              name="cardholderName"
              placeholder="Nome como está no cartão"
              value={cardData.cardholderName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expirationMonth" className="text-sm font-medium">
                Validade
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  name="expirationMonth"
                  onValueChange={(value) =>
                    handleSelectChange('expirationMonth', value)
                  }
                  value={cardData.expirationMonth}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <SelectItem
                          key={month}
                          value={month.toString().padStart(2, '0')}
                        >
                          {month.toString().padStart(2, '0')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select
                  name="expirationYear"
                  onValueChange={(value) =>
                    handleSelectChange('expirationYear', value)
                  }
                  value={cardData.expirationYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="securityCode" className="text-sm font-medium">
                CVV
              </Label>
              <Input
                id="securityCode"
                name="securityCode"
                placeholder="123"
                value={cardData.securityCode}
                onChange={handleChange}
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cpf" className="text-sm font-medium">
              CPF do Titular
            </Label>
            <Input
              id="cpf"
              name="cpf"
              placeholder="000.000.000-00"
              value={cardData.cpf}
              onChange={handleChange}
              maxLength={14}
            />
          </div>

          <div>
            <Label htmlFor="installments" className="text-sm font-medium">
              Parcelas
            </Label>
            <Select
              name="installments"
              onValueChange={(value) =>
                handleSelectChange('installments', value)
              }
              value={cardData.installments}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o número de parcelas" />
              </SelectTrigger>
              <SelectContent>
                {installmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border mt-6 flex items-center gap-3">
          <Lock className="text-gray-400 h-5 w-5" />
          <p className="text-xs text-gray-600">
            Seus dados de pagamento são criptografados e protegidos conforme os
            mais altos padrões de segurança.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Processando pagamento...</span>
            </div>
          ) : (
            <span>Finalizar Pagamento</span>
          )}
        </Button>
      </form>
    </div>
  );
};

export default CreditCardForm;
