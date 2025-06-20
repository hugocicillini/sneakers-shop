import { motion } from 'framer-motion';
import { Shield, Truck, Zap } from 'lucide-react';

const BannerShipping = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-gradient-to-r from-blue-100 to-rose-400 text-white rounded-lg p-4 md:p-6 mb-6 shadow-sm overflow-hidden"
    >
      <div className="relative flex items-center justify-between">
        {/* Conteúdo principal */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Ícone principal */}
          <div className="bg-green-100 p-2 md:p-3 rounded-full border border-green-200">
            <Truck size={20} className="text-green-600 md:w-6 md:h-6" />
          </div>

          {/* Texto principal */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
              Frete Grátis
            </h2>
            <p className="text-gray-600 text-xs md:text-sm font-medium">
              em compras acima de R$ 300
            </p>
          </div>
        </div>

        {/* Benefícios (apenas desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-center"
          >
            <div className="bg-blue-50 border border-blue-100 flex items-center justify-center p-2 rounded-full mx-auto mb-1">
              <Truck size={14} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Entrega</span>
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-center"
          >
            <div className="bg-orange-50 border border-orange-100 flex items-center justify-center p-2 rounded-full mx-auto mb-1">
              <Zap size={14} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Rápida</span>
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-center"
          >
            <div className="bg-purple-50 border border-purple-100 flex items-center justify-center p-2 rounded-full mx-auto mb-1">
              <Shield size={14} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Segura</span>
          </motion.div>
        </div>

        {/* CTA Button para mobile/tablet */}
        <div className="lg:hidden">
          <div className="bg-green-600 text-white px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-xs font-semibold">Aproveite!</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BannerShipping;
