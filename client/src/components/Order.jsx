import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  QrCode,
  Receipt,
  Repeat,
  Star,
  Ticket,
  Truck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const statusMap = {
  pending: {
    label: 'Pedido Recebido',
    color: 'bg-blue-100 text-blue-800',
    step: 1,
    icon: <Clock size={16} className="text-blue-600" />,
    description:
      'Seu pedido foi recebido e está aguardando confirmação de pagamento.',
  },
  payment_approved: {
    label: 'Pagamento Aprovado',
    color: 'bg-green-100 text-green-800',
    step: 2,
    icon: <CheckCircle2 size={16} className="text-green-600" />,
    description: 'Pagamento confirmado! Seu pedido está sendo preparado.',
  },
  separating: {
    label: 'Em Separação',
    color: 'bg-yellow-100 text-yellow-800',
    step: 3,
    icon: <Package size={16} className="text-yellow-600" />,
    description: 'Estamos separando seus produtos para envio.',
  },
  shipping: {
    label: 'Aguardando Transporte',
    color: 'bg-orange-100 text-orange-800',
    step: 4,
    icon: <Truck size={16} className="text-orange-600" />,
    description:
      'Seu pedido está pronto e aguardando coleta pela transportadora.',
  },
  in_transit: {
    label: 'Em Transporte',
    color: 'bg-purple-100 text-purple-800',
    step: 5,
    icon: <ArrowRight size={16} className="text-purple-600" />,
    description: 'Seu pedido está a caminho do endereço de entrega.',
  },
  delivered: {
    label: 'Entregue',
    color: 'bg-green-200 text-green-900',
    step: 6,
    icon: <CheckCircle2 size={16} className="text-green-700" />,
    description: 'Pedido entregue com sucesso!',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    step: 0,
    icon: <XCircle size={16} className="text-red-600" />,
    description: 'Este pedido foi cancelado.',
  },
  rejected: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-800',
    step: 0,
    icon: <XCircle size={16} className="text-red-600" />,
    description: 'Este pedido foi rejeitado.',
  },
  processing: {
    label: 'Processando',
    color: 'bg-yellow-100 text-yellow-800',
    step: 0,
    icon: <Clock size={16} className="text-yellow-600" />,
    description: 'Seu pedido está sendo processado.',
  },
};

const statusSteps = [
  { key: 'pending', label: 'Recebido', icon: Clock },
  { key: 'payment_approved', label: 'Pagamento', icon: CheckCircle2 },
  { key: 'separating', label: 'Separação', icon: Package },
  { key: 'shipping', label: 'Aguardando Transporte', icon: Truck },
  { key: 'in_transit', label: 'Em Transporte', icon: ArrowRight },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle2 },
];

const paymentIcons = {
  pix: <QrCode className="text-green-600" size={14} />,
  boleto: <Ticket className="text-blue-600" size={14} />,
  card: <CreditCard className="text-purple-600" size={14} />,
};

const formatCurrency = (value) =>
  value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OrderList = ({ orders }) => {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-2xl font-bold text-gray-800">
          Nenhum pedido encontrado
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Parece que você ainda não fez nenhum pedido. Que tal dar uma olhada em
          nossa coleção?
        </p>{' '}
        <button
          className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all"
          onClick={() => (window.location.href = '/products')}
        >
          Explorar Produtos
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = statusMap[order.status] || {
          label: order.status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle size={16} className="text-gray-600" />,
        };
        let paymentType = 'card';
        if (order.paymentDetails?.method?.includes('pix')) paymentType = 'pix';
        if (
          order.paymentDetails?.method?.includes('boleto') ||
          order.paymentDetails?.method?.includes('ticket')
        )
          paymentType = 'boleto';

        return (
          <Card
            key={order._id}
            className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white"
          >
            <CardHeader
              className="py-4 px-6 cursor-pointer bg-white border-b hover:bg-gray-50 transition-all"
              onClick={() => toggleOrderExpand(order._id)}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                    <Receipt size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base text-gray-900">
                        Pedido #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {paymentIcons[paymentType]}
                        {paymentType === 'card'
                          ? 'Cartão'
                          : paymentType.charAt(0).toUpperCase() +
                            paymentType.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
                  <span className="text-base font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    {expandedOrders[order._id] ? (
                      <ChevronUp size={18} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {expandedOrders[order._id] && order.status !== 'cancelled' && (
              <>
                <CardContent className="px-8 py-6 bg-gray-50">
                  {/* Status Progress Bar Premium */}{' '}
                  <div className="mb-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Package size={18} className="text-gray-600" />
                      Acompanhe seu pedido
                    </h4>
                    <div className="relative py-2">
                      {/* Linha de fundo (cinza) */}
                      <div className="absolute left-0 right-0 top-[24px] h-0.5 bg-gray-200 z-0" />
                      {/* Linha de progresso (preta/primária) */}
                      <div
                        className="absolute top-[24px] h-0.5 bg-primary z-10 rounded-full transition-all duration-500 ease-out"
                        style={{
                          left: '0%',
                          right: `${
                            100 -
                            (((statusMap[order.status]?.step || 1) - 1) /
                              (statusSteps.length - 1)) *
                              100
                          }%`,
                        }}
                      />
                      <div className="flex items-center justify-between mb-2 gap-0 relative z-20">
                        {statusSteps.map((step, idx) => {
                          const currentStep =
                            statusMap[order.status]?.step || 1;
                          const isActive = idx + 1 <= currentStep;
                          const isCompleted = idx + 1 < currentStep;
                          const IconComponent = step.icon;
                          return (
                            <div
                              key={step.key}
                              className="flex flex-col items-center flex-1 min-w-0"
                            >
                              <div
                                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all mb-1 mx-auto ${
                                  isCompleted
                                    ? 'bg-green-500 text-white border-green-500'
                                    : isActive
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-white text-gray-400 border-gray-200'
                                }`}
                                style={{ zIndex: 2 }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 size={15} />
                                ) : (
                                  <IconComponent size={15} />
                                )}
                              </div>
                              <span
                                className={`block text-[11px] text-center font-medium leading-tight mt-0.5 ${
                                  isActive ? 'text-gray-900' : 'text-gray-500'
                                }`}
                                style={{ minHeight: 28 }}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-700 text-center">
                        {statusMap[order.status]?.description ||
                          'Acompanhe o andamento do seu pedido.'}
                      </p>
                    </div>
                  </div>
                  {/* Products Section Premium */}{' '}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Package size={20} className="text-gray-600" />
                      Produtos ({order.items?.length || 0})
                    </h4>
                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={
                                  item.image || item.sneaker?.coverImage?.url
                                }
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                              />
                              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                                {item.quantity}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-lg text-gray-900">
                                {item.name}
                              </p>{' '}
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="px-2 py-1 bg-gray-100 rounded-lg font-medium">
                                  {item.color}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 rounded-lg font-medium">
                                  Tam: {item.size} | Qtd: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-semibold text-lg text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-500">
                                {formatCurrency(item.price)} cada
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Info Cards Grid Premium */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Delivery Card Premium */}{' '}
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Truck size={20} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-lg text-gray-900">
                          Endereço de Entrega
                        </span>
                      </div>
                      <div className="space-y-2 text-gray-800 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500" />
                          <span className="font-semibold">
                            {order.shipping?.address?.recipient}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          {order.shipping?.address?.street},{' '}
                          {order.shipping?.address?.number}
                        </p>
                        <p className="text-gray-700">
                          {order.shipping?.address?.neighborhood},{' '}
                          {order.shipping?.address?.city} -{' '}
                          {order.shipping?.address?.state}
                        </p>
                        <p className="text-gray-700">
                          CEP: {order.shipping?.address?.zipCode}
                        </p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        {['pending', 'payment_approved'].includes(
                          order.status
                        ) && (
                          <button
                            className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 font-medium text-sm hover:bg-blue-50 transition-all flex items-center gap-2"
                            onClick={() =>
                              toast({
                                title: 'Funcionalidade em desenvolvimento',
                                description:
                                  'Troca de endereço estará disponível em breve.',
                                variant: 'default',
                              })
                            }
                          >
                            <MapPin size={16} />
                            Alterar Endereço
                          </button>
                        )}
                        <button
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                          onClick={() =>
                            toast({
                              title: 'Código de rastreamento',
                              description:
                                'Código: BR123456789BR - Acompanhe no site dos Correios',
                              variant: 'default',
                            })
                          }
                        >
                          <Eye size={16} />
                          Rastrear
                        </button>
                      </div>
                    </div>
                    {/* Payment Card Premium */}{' '}
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {paymentIcons[paymentType]}
                        </div>
                        <span className="font-semibold text-lg text-gray-900">
                          Informações de Pagamento
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`capitalize font-semibold px-3 py-1 rounded-lg text-sm ${
                              order.paymentStatus === 'approved'
                                ? 'text-green-700 bg-green-100'
                                : order.paymentStatus === 'pending'
                                ? 'text-yellow-700 bg-yellow-100'
                                : 'text-red-700 bg-red-100'
                            }`}
                          >
                            {statusMap[order.paymentStatus]?.label ||
                              order.paymentStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">
                            Método:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {paymentType === 'card'
                              ? 'Cartão de Crédito'
                              : paymentType === 'pix'
                              ? 'PIX'
                              : 'Boleto Bancário'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">
                            Valor Total:
                          </span>
                          <span className="font-semibold text-lg text-gray-900">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        {order.paymentMethod === 'pix' &&
                          order.paymentDetails?.qr_code && (
                            <a
                              href={order.paymentDetails.qr_code}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-lg border border-green-300 text-green-700 font-medium text-sm hover:bg-green-50 transition-all flex items-center gap-2"
                            >
                              <QrCode size={16} />
                              Ver QR Code
                            </a>
                          )}
                        {order.paymentMethod === 'boleto' &&
                          order.paymentDetails?.boleto_url && (
                            <a
                              href={order.paymentDetails.boleto_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 font-medium text-sm hover:bg-blue-50 transition-all flex items-center gap-2"
                            >
                              <Download size={16} />
                              Baixar Boleto
                            </a>
                          )}
                        <button
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                          onClick={() =>
                            toast({
                              title: 'Nota fiscal',
                              description:
                                'Sua nota fiscal será enviada por email após a entrega.',
                              variant: 'default',
                            })
                          }
                        >
                          <Receipt size={16} />
                          Nota Fiscal
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons Premium */}{' '}
                  <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    {['pending', 'payment_approved'].includes(order.status) && (
                      <button
                        className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-all flex items-center gap-2"
                        onClick={() =>
                          toast({
                            title: 'Solicitação de cancelamento enviada',
                            description:
                              'Nossa equipe analisará sua solicitação em até 2 horas úteis.',
                            variant: 'default',
                          })
                        }
                      >
                        <XCircle size={16} />
                        Solicitar Cancelamento
                      </button>
                    )}
                    <button
                      className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-all flex items-center gap-2"
                      onClick={() =>
                        toast({
                          title: 'Suporte ao cliente',
                          description:
                            'Em breve você será redirecionado para o chat.',
                          variant: 'default',
                        })
                      }
                    >
                      <ExternalLink size={16} />
                      Falar com Suporte
                    </button>{' '}
                    {order.status === 'delivered' && (
                      <button
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
                        onClick={() =>
                          toast({
                            title: 'Obrigado!',
                            description:
                              'Sua avaliação nos ajuda a melhorar nossos serviços.',
                            variant: 'default',
                          })
                        }
                      >
                        <Star size={16} />
                        Avaliar Produtos
                      </button>
                    )}
                  </div>
                </CardContent>
              </>
            )}{' '}
            {/* Cancelled Order Section */}
            {order.status === 'cancelled' && expandedOrders[order._id] && (
              <CardContent className="px-8 py-6 bg-red-50">
                <div className="text-center space-y-3 mb-6">
                  <h3 className="text-xl font-semibold text-red-700">
                    Pedido Cancelado
                  </h3>
                  <p className="text-red-600 text-sm max-w-md mx-auto">
                    Este pedido foi cancelado e não será entregue.
                  </p>
                  {order.cancellationReason && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-red-200 inline-block">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Motivo:</span>{' '}
                        {order.cancellationReason}
                      </p>
                    </div>
                  )}
                </div>{' '}
                {/* Cancelled Products */}
                <div className="space-y-3">
                  {' '}
                  <h4 className="text-base font-medium text-gray-900 mb-3">
                    Produtos do pedido cancelado:
                  </h4>
                  {order.items?.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center gap-4 p-3 bg-white rounded-lg border opacity-75"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || item.sneaker?.coverImage?.url}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg border grayscale"
                        />
                        <div>
                          <p className="font-medium text-sm line-through text-gray-600">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.color} | Tam: {item.size} | Qtd:{' '}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-sm line-through text-gray-600">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>{' '}
                {/* Reorder button */}
                <div className="mt-6 text-center">
                  <button
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
                    onClick={() =>
                      toast({
                        title: 'Redirecionando...',
                        description:
                          'Você será redirecionado para refazer este pedido.',
                        variant: 'default',
                      })
                    }
                  >
                    <Repeat size={16} />
                    Refazer Pedido
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default OrderList;
