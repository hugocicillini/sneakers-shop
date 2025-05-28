import { Button } from '@/components/ui/button';
import LayoutCheckout from '@/layout/LayoutCheckout';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Home,
  QrCode,
  Receipt,
  Ticket,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const paymentIcons = {
  pix: <QrCode className="text-green-600" size={28} />, // Pix
  boleto: <Ticket className="text-blue-600" size={28} />, // Boleto
  card: <Receipt className="text-purple-600" size={28} />, // Cartão
};

const fetchOrder = async (orderId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
};

const Confirmation = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('Order ID:', orderId);
  useEffect(() => {
    fetchOrder(orderId).then((data) => {
      setOrder(data);
      setLoading(false);
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.7 },
        });
      }, 600);
    });
  }, [orderId]);

  if (loading) {
    return (
      <LayoutCheckout activeStep={4}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando confirmação...</p>
        </div>
      </LayoutCheckout>
    );
  }

  if (!order) {
    return (
      <LayoutCheckout activeStep={4}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <CheckCircle size={56} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
          <p className="text-gray-600 mb-6">
            Verifique se o código do pedido está correto.
          </p>
          <Button onClick={() => navigate('/')} className="flex gap-2">
            <Home size={18} /> Voltar para a Home
          </Button>
        </div>
      </LayoutCheckout>
    );
  }

  // Determina o método de pagamento
  let paymentType = 'card';
  if (order.paymentDetails?.method?.includes('pix')) paymentType = 'pix';
  if (
    order.paymentDetails?.method?.includes('boleto') ||
    order.paymentDetails?.method?.includes('ticket')
  )
    paymentType = 'boleto';

  return (
    <LayoutCheckout activeStep={4}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto px-4 py-12"
      >
        <div className="flex flex-col items-center text-center">
          <CheckCircle
            size={72}
            className="text-green-500 mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Pedido Confirmado!
          </h1>
          <p className="text-lg text-gray-700 mb-6 max-w-xl">
            Obrigado por comprar na{' '}
            <span className="font-bold text-black">Sneakers Shop</span>! Seu
            pedido foi recebido e está sendo processado.
          </p>
          <div className="flex items-center gap-3 mb-6">
            <span className="rounded-full bg-gray-100 p-3 border shadow-sm">
              {paymentIcons[paymentType]}
            </span>
            <span className="text-base font-medium text-gray-700">
              Pagamento:{' '}
              <span className="capitalize">
                {paymentType === 'card' ? 'Cartão' : paymentType}
              </span>
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-lg border p-6 mb-8 w-full max-w-md">
            <div className="flex flex-col gap-2 text-left">
              <span className="text-gray-500 text-xs">Nº do Pedido</span>
              <span className="font-bold text-lg tracking-wider">
                {order.orderNumber}
              </span>
              <span className="text-gray-500 text-xs mt-4">Status</span>
              <span className="font-semibold text-blue-700 capitalize">
                {order.status === 'pending'
                  ? 'Aguardando pagamento'
                  : order.status === 'processing'
                  ? 'Processando'
                  : order.status === 'delivered'
                  ? 'Entregue'
                  : order.status}
              </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/account')}
              className="flex gap-2"
            >
              <Receipt size={18} /> Ver meus pedidos
            </Button>
            <Button onClick={() => navigate('/')} className="flex gap-2">
              <Home size={18} /> Voltar para a Home
            </Button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-8"
          >
            <p className="text-gray-500 text-sm mb-2">Dúvidas ou problemas?</p>
            <a
              href="https://wa.me/5599999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-700 font-medium hover:underline hover:text-green-800 transition"
            >
              <ArrowRight size={16} /> Fale com nosso suporte via WhatsApp
            </a>
          </motion.div>
        </div>
      </motion.div>
    </LayoutCheckout>
  );
};

export default Confirmation;
