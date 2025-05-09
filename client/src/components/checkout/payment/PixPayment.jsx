import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const PixPayment = ({
  onGenerateCode,
  onVerifyPayment,
  pixData,
  processing,
  checkingStatus,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrImageSrc, setQrImageSrc] = useState('');

  // Processar o QR code quando os dados do PIX chegarem
  useEffect(() => {
    if (pixData?.qrCodeBase64) {
      // Usar a imagem base64 fornecida pelo backend diretamente
      setQrImageSrc(`data:image/png;base64,${pixData.qrCodeBase64}`);
    } else if (pixData?.qrCode) {
      // Fallback: gerar QR code a partir do texto 
      setQrImageSrc(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixData.qrCode)}&choe=UTF-8`);
    }
  }, [pixData]);

  // Copia o código PIX para a área de transferência
  const copyToClipboard = async () => {
    if (!pixData?.qrCode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para a área de transferência',
      });

      // Resetar o estado "copied" após 3 segundos
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o código PIX',
        variant: 'destructive',
      });
    }
  };

  // Quando ainda não temos o QR code
  if (!pixData) {
    return (
      <div className="flex flex-col items-center space-y-6 py-4">
        <div className="text-center mb-6">
          <h3 className="font-medium text-lg mb-2">Pagamento com PIX</h3>
          <p className="text-gray-600">
            Pague com PIX e ganhe 5% de desconto! Gere o código QR para pagar
            instantaneamente.
          </p>
        </div>

        <Button
          onClick={onGenerateCode}
          disabled={processing}
          className="w-full max-w-sm h-12 rounded-full bg-black hover:bg-black/90"
        >
          {processing ? 'Gerando código...' : 'Gerar Código PIX'}
        </Button>
      </div>
    );
  }

  // Quando já temos o QR code
  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="text-center mb-2">
        <h3 className="font-medium text-lg">Pague com PIX</h3>
        <p className="text-gray-600 text-sm">
          Escaneie o código QR ou copie o código PIX para pagar
        </p>
        <p className="text-sm mt-1">Este QR code expira em 30 minutos</p>
      </div>

      {/* QR Code PIX com fallback mais robusto */}
      <div className="border-2 border-gray-200 p-4 rounded-lg mb-4">
        {qrImageSrc ? (
          <img
            src={qrImageSrc}
            alt="QR Code PIX"
            className="w-52 h-52 object-contain"
            onError={(e) => {
              console.error('Erro ao carregar QR code com Google Chart API');
              // Segunda tentativa com qrserver.com se o Google Chart falhar
              e.target.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixData.qrCode)}&size=200x200`;
              e.target.onerror = () => {
                e.target.src = 'https://via.placeholder.com/200x200?text=QR+Code+PIX';
                e.target.onerror = null;
              };
            }}
          />
        ) : (
          <div className="w-52 h-52 flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">QR Code não disponível</p>
          </div>
        )}
      </div>

      {/* Código PIX */}
      <div className="w-full">
        <div className="p-3 bg-gray-100 rounded-lg text-xs break-all font-mono relative">
          {pixData.qrCode}
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            disabled={copied}
          >
            <Copy size={16} />
          </Button>
        </div>
        <Button
          onClick={copyToClipboard}
          variant="outline"
          className="w-full mt-2"
          disabled={copied}
        >
          {copied ? 'Copiado!' : 'Copiar código PIX'}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4">
        <p>Após o pagamento, clique no botão abaixo para verificar o status.</p>
        <p className="mt-1">
          A confirmação pode levar alguns segundos para ser processada.
        </p>
      </div>

      <Button
        onClick={onVerifyPayment}
        disabled={checkingStatus}
        className="w-full h-12 rounded-full bg-black hover:bg-black/90 flex items-center justify-center gap-2 mt-4"
      >
        {checkingStatus ? (
          <>
            <RefreshCw className="animate-spin" size={18} />
            Verificando pagamento...
          </>
        ) : (
          'Já paguei, verificar'
        )}
      </Button>
    </div>
  );
};

export default PixPayment;
