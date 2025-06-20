import { Link } from 'react-router-dom';

const LayoutCheckout = ({ children, activeStep }) => {
  const steps = [
    { number: 1, name: 'Carrinho', path: '/checkout/cart' },
    { number: 2, name: 'Identificação', path: '/checkout/identification' },
    { number: 3, name: 'Pagamento', path: '/checkout/payment' },
  ];

  return (
    <div>
      <header className="bg-[#f7f7f7] py-4 md:py-6 px-4 shadow">
        <div className="flex items-center justify-between md:justify-around">
          <div className="flex items-center justify-center">
            <Link to="/" className="font-bold text-lg">
              <img src="/logo.png" alt="Logo" className="h-16" />
            </Link>
          </div>
        </div>
      </header>

      {/* Indicador de etapas do checkout */}
      <div className="flex items-center justify-center my-8 px-4">
        <div className="flex w-full max-w-2xl relative">
          {/* Linha de progresso que conecta os círculos */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
          {/* Linha de progresso preenchida até a etapa atual */}
          <div
            className="absolute top-4 left-0 h-0.5 bg-black transition-all duration-300"
            style={{
              width: `${((activeStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />

          {steps.map((step) => (
            <div
              key={step.number}
              className="flex-1 flex flex-col items-center relative z-10"
            >
              {activeStep >= step.number ? (
                <Link
                  to={step.path}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                    transition-colors bg-black text-white`}
                >
                  {step.number}
                </Link>
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold
                    bg-gray-200 text-gray-500 cursor-default"
                >
                  {step.number}
                </div>
              )}
              <span
                className={`text-xs mt-2 font-medium ${
                  activeStep === step.number ? 'text-black' : 'text-gray-500'
                }`}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {children}

      <div className="flex justify-center items-center gap-6 py-8 bg-[#f7f7f7]">
        <img
          src="https://img.icons8.com/color/48/000000/visa.png"
          alt="Visa"
          className="h-10 w-auto"
        />
        <img
          src="https://img.icons8.com/color/48/000000/mastercard.png"
          alt="Mastercard"
          className="h-10 w-auto"
        />
        <img
          src="https://img.icons8.com/color/48/000000/boleto-bankario.png"
          alt="Boleto Bancário"
          className="h-10 w-auto"
        />
        <img
          src="https://img.icons8.com/color/48/000000/pix.png"
          alt="PIX"
          className="h-9 w-auto"
        />
      </div>
    </div>
  );
};

export default LayoutCheckout;
