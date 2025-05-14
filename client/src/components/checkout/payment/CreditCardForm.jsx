import { loadMercadoPago } from '@mercadopago/sdk-js';
import { useEffect, useState } from 'react';

const CreditCardForm = ({ onSubmit }) => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationDate: '',
    securityCode: '',
    identificationType: 'CPF',
    identificationNumber: '',
    issuer: '',
  });

  // Estados para informações do cartão
  const [cardToken, setCardToken] = useState(null);
  const [cardBin, setCardBin] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [selectedInstallment, setSelectedInstallment] = useState('');

  useEffect(() => {
    const initMercadoPago = async () => {
      try {
        await loadMercadoPago();
        const mp = new window.MercadoPago(
          import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY
        );

        // Configurar os campos do cartão
        const cardForm = mp.cardForm({
          amount: '100.00',
          iframe: true,
          form: {
            id: 'form-checkout',
            cardNumber: {
              id: 'form-checkout__cardNumber',
              placeholder: '5031 7557 3453 0604',
            },
            expirationDate: {
              id: 'form-checkout__expirationDate',
              placeholder: 'MM/YY',
            },
            securityCode: {
              id: 'form-checkout__securityCode',
              placeholder: '123',
            },
            cardholderName: {
              id: 'form-checkout__cardholderName',
              placeholder: 'Titular do cartão',
            },
            issuer: {
              id: 'form-checkout__issuer',
              placeholder: 'Banco emissor',
            },
            installments: {
              id: 'form-checkout__installments',
              placeholder: 'Parcelas',
            },
            identificationType: {
              id: 'form-checkout__identificationType',
            },
            identificationNumber: {
              id: 'form-checkout__identificationNumber',
              placeholder: 'CPF',
            },
          },
          callbacks: {
            onFormMounted: (error) => {
              if (error) console.log('Form Mounted error: ', error);
              setLoading(false);
            },
            onSubmit: (event) => {
              event.preventDefault();

              const {
                paymentMethodId,
                issuerId,
                cardholderEmail,
                amount,
                token,
                installments,
                identificationNumber,
                identificationType,
              } = cardForm.getCardFormData();

              // Dados para enviar ao backend
              const paymentData = {
                token,
                paymentMethodId,
                issuerId,
                installments,
                identificationNumber,
                identificationType,
              };

              onSubmit(paymentData);
            },
            onFetching: (resource) => {
              if (resource === 'cardToken') {
                // Aqui você pode mostrar um loading
              }
            },
            onCardTokenReceived: (error, token) => {
              if (error) {
                console.error('Token error:', error);
                return;
              }
              setCardToken(token);
            },
            onPaymentMethodsReceived: (error, methods) => {
              if (error) {
                console.error('Payment methods error:', error);
                return;
              }
              setPaymentMethods(methods);
            },
            onInstallmentsReceived: (error, options) => {
              if (error) {
                console.error('Installments error:', error);
                return;
              }
              setInstallments(options);
            },
          },
        });
      } catch (error) {
        console.error('Error inicializando Mercado Pago:', error);
        setLoading(false);
      }
    };

    initMercadoPago();
  }, []);

  return (
    <form id="form-checkout" className="space-y-4">
      <div>
        <label
          htmlFor="form-checkout__cardNumber"
          className="block text-sm font-medium text-gray-700"
        >
          Número do Cartão
        </label>
        <div
          id="form-checkout__cardNumber"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="form-checkout__expirationDate"
            className="block text-sm font-medium text-gray-700"
          >
            Validade
          </label>
          <div
            id="form-checkout__expirationDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          ></div>
        </div>
        <div>
          <label
            htmlFor="form-checkout__securityCode"
            className="block text-sm font-medium text-gray-700"
          >
            CVV
          </label>
          <div
            id="form-checkout__securityCode"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          ></div>
        </div>
      </div>

      <div>
        <label
          htmlFor="form-checkout__cardholderName"
          className="block text-sm font-medium text-gray-700"
        >
          Titular do Cartão
        </label>
        <div
          id="form-checkout__cardholderName"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="form-checkout__identificationType"
            className="block text-sm font-medium text-gray-700"
          >
            Tipo de Documento
          </label>
          <div
            id="form-checkout__identificationType"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          ></div>
        </div>
        <div>
          <label
            htmlFor="form-checkout__identificationNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Número do Documento
          </label>
          <div
            id="form-checkout__identificationNumber"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          ></div>
        </div>
      </div>

      <div>
        <label
          htmlFor="form-checkout__issuer"
          className="block text-sm font-medium text-gray-700"
        >
          Banco Emissor
        </label>
        <div
          id="form-checkout__issuer"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        ></div>
      </div>

      <div>
        <label
          htmlFor="form-checkout__installments"
          className="block text-sm font-medium text-gray-700"
        >
          Parcelas
        </label>
        <div
          id="form-checkout__installments"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        ></div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800"
      >
        {loading ? 'Carregando...' : 'Pagar com Cartão'}
      </button>
    </form>
  );
};

export default CreditCardForm;