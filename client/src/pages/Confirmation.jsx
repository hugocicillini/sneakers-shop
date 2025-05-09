import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { CheckCircle, AlertTriangle, ArrowRight, Copy, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { checkPaymentStatus } from '@/services/payment.service';

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar dados de pagamento do sessionStorage ou URL
    const getOrderDetails = () => {
      try {
        // Verificar se temos dados na URL (vindo do redirect)
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('payment_id') || params.get('paymentId');
        const orderId = params.get('orderId');
        const status = params.get('status') || 'pending';
        
        // Verificar sessionStorage se não temos na URL
        const storedPaymentData = sessionStorage.getItem('paymentResult');
        
        if (storedPaymentData) {
          const paymentData = JSON.parse(storedPaymentData);
          setOrderDetails(paymentData);
          setLoading(false);
          
          // Limpar o carrinho após confirmação bem-sucedida
          clearCart();
          
          return;
        }
        
        if (paymentId || orderId) {
          // Buscar status atualizado do pagamento
          if (paymentId) {
            checkPaymentStatus(paymentId)
              .then(response => {
                if (response.success) {
                  setOrderDetails({
                    orderId: response.data.orderId || orderId,
                    paymentId: paymentId,
                    status: response.data.status || status,
                    paymentMethod: response.data.paymentMethod || 'unknown',
                  });
                  
                  // Limpar o carrinho após confirmação bem-sucedida
                  clearCart();
                } else {
                  console.error('Erro ao obter status do pagamento:', response.message);
                }
              })
              .catch(error => {
                console.error('Erro ao verificar status do pagamento:', error);
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            // Se temos apenas orderId
            setOrderDetails({
              orderId: orderId,
              status: status,
              paymentMethod: 'unknown'
            });
            setLoading(false);
            clearCart();
          }
          return;
        }
        
        // Se não temos nenhuma informação, recuperar do sessionStorage temporário
        const tempOrderInfo = sessionStorage.getItem('tempOrderInfo');
        if (tempOrderInfo) {
          setOrderDetails(JSON.parse(tempOrderInfo));
          setLoading(false);
          clearCart();
          return;
        }
        
        // Se chegamos aqui, não temos informações suficientes
        setLoading(false);
      } catch (error) {
        console.error('Erro ao processar dados do pedido:', error);
        setLoading(false);
      }
    };

    getOrderDetails();

    // Limpar sessionStorage quando componente for desmontado
    return () => {
      sessionStorage.removeItem('paymentResult');
      sessionStorage.removeItem('tempOrderInfo');
    };
  }, [location, clearCart]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copiado!",
          description: "Código copiado para a área de transferência.",
        });
      })
      .catch(() => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o código.",
          variant: "destructive"
        });
      });
  };

  const renderPaymentDetails = () => {
    if (!orderDetails) return null;

    // Dados do PIX (simulados ou reais)
    if (orderDetails.paymentMethod === 'pix') {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
          <h3 className="font-semibold text-lg mb-4">Pagamento via PIX</h3>
          
          {orderDetails.status === 'approved' ? (
            <div className="text-green-600 flex items-center gap-2">
              <CheckCircle size={20} /> Pagamento aprovado com sucesso!
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Finalize seu pagamento com PIX. Escaneie o QR code ou copie o código abaixo.
                O pagamento é processado em até 30 segundos após a confirmação.
              </p>
              
              {orderDetails.qrCodeBase64 && (
                <div className="flex flex-col items-center justify-center my-4">
                  <img 
                    src={`data:image/png;base64,${orderDetails.qrCodeBase64}`} 
                    alt="QR Code PIX"
                    className="w-48 h-48 border p-2"
                  />
                </div>
              )}
              
              {orderDetails.qrCode && (
                <div className="relative">
                  <div className="bg-gray-50 p-3 rounded border text-sm font-mono break-all">
                    {orderDetails.qrCode}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyToClipboard(orderDetails.qrCode)}
                  >
                    <Copy size={18} />
                  </Button>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mt-4">
                Este QR code expira em 30 minutos. Após o pagamento, você receberá uma confirmação por email.
              </p>
            </>
          )}
        </div>
      );
    }
    
    // Dados do Boleto
    if (orderDetails.paymentMethod === 'boleto') {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
          <h3 className="font-semibold text-lg mb-4">Pagamento via Boleto</h3>
          
          <p className="text-gray-600 mb-4">
            Seu boleto foi gerado com sucesso. Você pode imprimi-lo ou copiar o código de barras.
          </p>
          
          {orderDetails.barcode && (
            <div className="relative">
              <div className="bg-gray-50 p-3 rounded border text-sm font-mono break-all">
                {orderDetails.barcode}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => copyToClipboard(orderDetails.barcode)}
              >
                <Copy size={18} />
              </Button>
            </div>
          )}
          
          {orderDetails.pdfUrl && (
            <Button 
              variant="outline" 
              className="mt-4 w-full flex items-center justify-center gap-2"
              onClick={() => window.open(orderDetails.pdfUrl, '_blank')}
            >
              <Download size={18} />
              Baixar Boleto
            </Button>
          )}
          
          <p className="text-sm text-red-500 mt-4">
            O boleto vence em 3 dias úteis. Após o pagamento, a compensação pode levar até 3 dias úteis.
          </p>
        </div>
      );
    }
    
    // Cartão de Crédito
    if (orderDetails.paymentMethod === 'credit_card') {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
          <h3 className="font-semibold text-lg mb-4">Pagamento com Cartão de Crédito</h3>
          
          <div className="text-green-600 flex items-center gap-2 mb-4">
            <CheckCircle size={20} /> 
            Pagamento aprovado com sucesso!
          </div>
          
          <p className="text-gray-600">
            Seu pagamento foi processado e seu pedido será preparado para envio.
            Você receberá atualizações de status por email.
          </p>
        </div>
      );
    }
    
    // Método desconhecido ou outro
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
        <h3 className="font-semibold text-lg mb-4">Detalhes do Pagamento</h3>
        
        {orderDetails.status === 'approved' || orderDetails.status === 'success' ? (
          <div className="text-green-600 flex items-center gap-2">
            <CheckCircle size={20} /> Pagamento aprovado com sucesso!
          </div>
        ) : orderDetails.status === 'pending' ? (
          <div className="text-orange-500 flex items-center gap-2">
            <AlertTriangle size={20} /> Aguardando confirmação do pagamento
          </div>
        ) : (
          <div className="text-red-500 flex items-center gap-2">
            <AlertTriangle size={20} /> Houve um problema com seu pagamento
          </div>
        )}
        
        <p className="text-gray-600 mt-4">
          Você receberá atualizações sobre o status do seu pedido por email.
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <LayoutCheckout activeStep={4}>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando informações do seu pedido...</p>
        </div>
      </LayoutCheckout>
    );
  }

  // Se não encontramos dados do pedido
  if (!orderDetails) {
    return (
      <LayoutCheckout activeStep={4}>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <AlertTriangle size={48} className="mx-auto text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Informações do pedido não encontradas</h2>
            <p className="text-gray-600 mb-6">
              Não foi possível encontrar informações sobre seu pedido. 
              Se você acredita que isso é um erro, por favor entre em contato com o suporte.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
              >
                Voltar à loja
              </Button>
              <Button onClick={() => navigate('/account')}>
                Meus Pedidos
              </Button>
            </div>
          </div>
        </div>
      </LayoutCheckout>
    );
  }

  return (
    <LayoutCheckout activeStep={4}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="flex flex-col items-center text-center mb-8">
            {orderDetails.status === 'approved' || orderDetails.status === 'success' ? (
              <CheckCircle size={64} className="text-green-500 mb-4" />
            ) : orderDetails.status === 'pending' ? (
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <AlertTriangle size={48} className="text-orange-500" />
              </div>
            ) : (
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
            )}
            
            <h1 className="text-2xl font-bold">
              {orderDetails.status === 'approved' || orderDetails.status === 'success'
                ? 'Pagamento aprovado!'
                : orderDetails.status === 'pending'
                ? 'Pedido recebido!'
                : 'Ocorreu um problema com seu pedido'}
            </h1>
            
            <p className="text-gray-600 mt-2">
              {orderDetails.status === 'approved' || orderDetails.status === 'success'
                ? 'Seu pedido foi processado com sucesso.'
                : orderDetails.status === 'pending'
                ? 'Seu pedido foi recebido e está aguardando confirmação de pagamento.'
                : 'Houve um problema ao processar seu pagamento.'}
            </p>
          </div>

          <div className="mb-8">
            <div className="border-b pb-4 mb-4">
              <h2 className="font-semibold text-lg mb-2">Informações do Pedido</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número do pedido:</span>
                  <span className="font-medium">{orderDetails.orderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    orderDetails.status === 'approved' || orderDetails.status === 'success' 
                      ? 'text-green-600' 
                      : orderDetails.status === 'pending' 
                      ? 'text-orange-500'
                      : 'text-red-500'
                  }`}>
                    {orderDetails.status === 'approved' || orderDetails.status === 'success'
                      ? 'Aprovado'
                      : orderDetails.status === 'pending'
                      ? 'Aguardando pagamento'
                      : 'Falhou'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalhes específicos do método de pagamento */}
          {renderPaymentDetails()}
          
          {/* Botões de ação */}
          <div className="mt-8 space-y-3">
            <Button 
              className="w-full h-12 rounded-full bg-black hover:bg-black/90" 
              onClick={() => navigate('/account')}
            >
              Acompanhar meus pedidos
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 rounded-full"
              onClick={() => navigate('/')}
            >
              Continuar comprando <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </LayoutCheckout>
  );
};

export default Confirmation;
 