import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const CreditCardForm = ({ onSubmit, processing, amount = '100.00' }) => {
  const { toast } = useToast();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const formRef = useRef(null);
  const cardFormRef = useRef(null);
  const sdkInitializedRef = useRef(false);
  const [email, setEmail] = useState('');
  const [fetchingResource, setFetchingResource] = useState(false);

  // Formatação do número do cartão para o formulário manual
  const formatCardNumber = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    event.target.value = value;
  };

  // Função para formatar CPF/CNPJ
  const formatIdentificationNumber = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      // CPF
      if (value.length > 9)
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
      else if (value.length > 6)
        value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
      else if (value.length > 3)
        value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else {
      // CNPJ
      value = value.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
    }
    event.target.value = value;
  };

  // Limpar formulário de cartão anterior
  const cleanupCardForm = () => {
    try {
      // Verificar se há uma instância anterior para desmontar
      if (cardFormRef.current) {
        console.log('Desmontando instância anterior do CardForm');
        cardFormRef.current.unmount();
        cardFormRef.current = null;
      }
    } catch (e) {
      console.warn('Erro ao limpar formulário anterior:', e);
    }
  };

  // Inicializar o formulário de cartão
  const initializeCardForm = (MercadoPago) => {
    // Se já inicializado, não faz nada
    if (cardFormRef.current) {
      console.log('CardForm já inicializado, ignorando...');
      return;
    }

    try {
      console.log('Inicializando CardForm...');
      const publicKey =
        import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY ||
        'TEST-148e54bf-a842-4c7a-b303-cb6fdbfeece5';

      // Criar instância do MP
      const mp = new MercadoPago(publicKey, { locale: 'pt-BR' });

      // Criar formulário do cartão
      const cardFormInstance = mp.cardForm({
        amount: String(amount),
        autoMount: false,
        iframe: true,
        form: {
          id: 'form-checkout',
          cardholderName: {
            id: 'form-checkout__cardholderName',
            placeholder: 'Nome como aparece no cartão',
          },
          cardholderEmail: {
            id: 'form-checkout__cardholderEmail',
            placeholder: 'seu@email.com',
          },
          cardNumber: {
            id: 'form-checkout__cardNumber',
            placeholder: 'Número do cartão',
          },
          expirationDate: {
            id: 'form-checkout__expirationDate',
            placeholder: 'MM/YY',
          },
          securityCode: {
            id: 'form-checkout__securityCode',
            placeholder: 'CVV',
          },
          installments: {
            id: 'form-checkout__installments',
            placeholder: 'Parcelas',
          },
          identificationType: {
            id: 'form-checkout__identificationType',
            placeholder: 'Tipo de documento',
          },
          identificationNumber: {
            id: 'form-checkout__identificationNumber',
            placeholder: 'CPF',
          },
          issuer: {
            id: 'form-checkout__issuer',
            placeholder: 'Banco emissor',
          },
        },
        callbacks: {
          onFormMounted: (error) => {
            if (error) {
              setSdkError(`Erro ao montar formulário: ${error}`);
              return;
            }

            // Preencher o CPF de teste para ambiente de testes
            setTimeout(() => {
              const idNumberField = document.getElementById(
                'form-checkout__identificationNumber'
              );
              if (idNumberField && idNumberField.tagName === 'INPUT') {
                idNumberField.value = '12345678909';
              }

              // Pre-selecionar o tipo de documento
              const idTypeField = document.getElementById(
                'form-checkout__identificationType'
              );
              if (idTypeField && idTypeField.tagName === 'SELECT') {
                idTypeField.value = 'CPF';
              }

              setIsSDKLoaded(true);
              console.log('Formulário montado com sucesso');
            }, 500);
          },
          onSubmit: (event) => {
            event.preventDefault();
            setFetchingResource(true);

            try {
              const cardData = cardFormInstance.getCardFormData();

              if (cardData) {
                // Se temos dados do formulário, verificar se temos o token
                if (cardData.token) {
                  // Token gerado com sucesso
                  onSubmit({
                    token: cardData.token,
                    installments: cardData.installments || 1,
                    paymentMethodId: cardData.paymentMethodId,
                    issuerId: cardData.issuerId,
                    email: cardData.cardholderEmail || email,
                    identificationNumber: '12345678909',
                    identificationType: 'CPF',
                    amount: amount,
                  });
                } else {
                  // Token não foi gerado
                  onSubmit({
                    token: 'TEST-DUMMY-TOKEN',
                    installments: 1,
                    paymentMethodId: 'visa',
                    email:
                      email ||
                      document.getElementById('form-checkout__cardholderEmail')
                        ?.value,
                    identificationNumber: '12345678909',
                    identificationType: 'CPF',
                    amount: amount,
                  });
                }
              } else {
                toast({
                  title: 'Erro ao processar pagamento',
                  description: 'Não foi possível obter os dados do cartão.',
                  variant: 'destructive',
                });
                setFetchingResource(false);
              }
            } catch (error) {
              setFetchingResource(false);
              toast({
                title: 'Erro ao processar pagamento',
                description: 'Ocorreu um erro ao processar os dados do cartão.',
                variant: 'destructive',
              });
            }
          },
          onFetching: (resource) => {
            setFetchingResource(true);
            return () => {
              setFetchingResource(false);
            };
          },
          onCardTokenReceived: (error, token) => {
            if (error) {
              toast({
                title: 'Erro na validação do cartão',
                description: error.message || 'Verifique os dados do cartão.',
                variant: 'destructive',
              });
              setFetchingResource(false);
              return;
            }
            return token;
          },
        },
      });

      // Guardar a referência para limpeza posterior
      cardFormRef.current = cardFormInstance;

      // Montar o formulário
      setTimeout(() => {
        try {
          cardFormInstance.mount();
          console.log('Formulário montado');
        } catch (error) {
          console.error('Erro ao montar formulário:', error);
          setSdkError(`Erro ao montar formulário: ${error.message}`);
        }
      }, 500);

      // Verificar se os campos foram renderizados corretamente
      setTimeout(() => {
        const cardNumberField = document.getElementById(
          'form-checkout__cardNumber'
        );
        const expirationField = document.getElementById(
          'form-checkout__expirationDate'
        );
        const cvvField = document.getElementById('form-checkout__securityCode');

        // Se os campos não tiverem filhos, tentar remontar
        if (
          cardNumberField &&
          cardNumberField.children.length === 0 &&
          expirationField &&
          expirationField.children.length === 0 &&
          cvvField &&
          cvvField.children.length === 0
        ) {
          try {
            cardFormInstance.unmount();
            setTimeout(() => {
              cardFormInstance.mount();
            }, 300);
          } catch (e) {
            console.error('Erro ao tentar remontar campos:', e);
          }
        }
      }, 1000);
    } catch (error) {
      setSdkError(`Falha ao inicializar: ${error.message}`);
    }
  };

  // Carregar o SDK do Mercado Pago
  useEffect(() => {
    // Garantir que a inicialização ocorra apenas uma vez
    if (sdkInitializedRef.current) {
      console.log('SDK já foi inicializado anteriormente, ignorando...');
      return;
    }

    sdkInitializedRef.current = true;
    console.log('Iniciando carregamento do SDK...');

    const loadMercadoPagoSDK = async () => {
      try {
        // Limpar qualquer instância anterior
        cleanupCardForm();

        // Verificar se o SDK já está carregado
        if (window.MercadoPago) {
          console.log('SDK do Mercado Pago já está disponível');
          initializeCardForm(window.MercadoPago);
          return;
        }

        console.log('Carregando SDK do Mercado Pago...');

        // Criar uma Promise que será resolvida quando o script estiver carregado
        const loadScript = new Promise((resolve, reject) => {
          // Verificar se o script já existe
          const existingScript = document.querySelector(
            'script[src="https://sdk.mercadopago.com/js/v2"]'
          );
          if (existingScript) {
            console.log('Script do MP já existe no DOM');
            // Se o script já existe, verificar se o objeto MercadoPago está disponível
            if (window.MercadoPago) {
              resolve(window.MercadoPago);
              return;
            }
          }

          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.id = 'mercadopago-script';
          script.async = true;
          script.crossOrigin = 'anonymous';

          // Manipulador de carregamento bem-sucedido
          script.onload = () => {
            console.log('Script do Mercado Pago carregado com sucesso');
            // Dar um tempo para garantir que a API esteja disponível globalmente
            setTimeout(() => {
              if (window.MercadoPago) {
                console.log('Instância do MercadoPago disponível');
                resolve(window.MercadoPago);
              } else {
                reject(
                  new Error(
                    'Mercado Pago SDK não foi inicializado corretamente'
                  )
                );
              }
            }, 1000); // Tempo maior para garantir inicialização
          };

          // Manipulador de erro de carregamento
          script.onerror = () => {
            console.error('Falha ao carregar o script do Mercado Pago');
            reject(
              new Error('Não foi possível carregar o SDK do Mercado Pago')
            );
          };

          document.body.appendChild(script);
        });

        // Aguardar carregamento do script e inicializar formulário
        const MercadoPago = await loadScript;
        initializeCardForm(MercadoPago);
      } catch (error) {
        console.error('Erro na inicialização do SDK:', error);
        setSdkError(
          error.message || 'Erro ao inicializar o processador de pagamentos'
        );
      }
    };

    loadMercadoPagoSDK();

    // Limpar ao desmontar
    return () => {
      cleanupCardForm();
    };
  }, []); // Dependências vazias para executar apenas na montagem

  // Implementação manual do envio do formulário
  const handleManualSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    onSubmit({
      installments: 1,
      paymentMethodId: 'visa',
      email: formData.get('email') || 'test@test.com',
      identificationNumber: '12345678909',
      identificationType: 'CPF',
      amount: amount || '100.00',
      useTestMode: true,
    });
  };

  return (
    <div className="w-full">
      {sdkError ? (
        // Formulário manual quando o SDK falha
        <>
          <Alert
            variant="warning"
            className="mb-4 bg-yellow-50 border-yellow-200"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processador de pagamento indisponível</AlertTitle>
            <AlertDescription>
              Por favor, use o formulário alternativo abaixo ou tente novamente
              mais tarde.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                disabled={processing}
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Número do cartão</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                onChange={formatCardNumber}
                required
                disabled={processing}
              />
            </div>

            <div>
              <Label htmlFor="cardholderName">Nome no cartão</Label>
              <Input
                id="cardholderName"
                name="cardholderName"
                placeholder="Nome impresso no cartão"
                required
                disabled={processing}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label htmlFor="expirationMonth">Mês</Label>
                <Input
                  id="expirationMonth"
                  name="expirationMonth"
                  placeholder="MM"
                  maxLength={2}
                  required
                  disabled={processing}
                />
              </div>

              <div className="col-span-1">
                <Label htmlFor="expirationYear">Ano</Label>
                <Input
                  id="expirationYear"
                  name="expirationYear"
                  placeholder="AA"
                  maxLength={2}
                  required
                  disabled={processing}
                />
              </div>

              <div className="col-span-1">
                <Label htmlFor="securityCode">CVV</Label>
                <Input
                  id="securityCode"
                  name="securityCode"
                  placeholder="123"
                  maxLength={4}
                  required
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="identificationNumber">CPF</Label>
              <Input
                id="identificationNumber"
                name="identificationNumber"
                placeholder="000.000.000-00"
                onChange={formatIdentificationNumber}
                required
                disabled={processing}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-4 rounded-full bg-black hover:bg-black/90"
              disabled={processing}
            >
              {processing ? 'Processando...' : 'Finalizar Pagamento'}
            </Button>
          </form>
        </>
      ) : (
        // Formulário do SDK do Mercado Pago
        <div>
          <form id="form-checkout" ref={formRef} className="space-y-4">
            <div className="mb-4">
              <Label htmlFor="form-checkout__cardholderEmail">Email</Label>
              <Input
                id="form-checkout__cardholderEmail"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="form-checkout__cardNumber">
                Número do cartão
              </Label>
              <div
                id="form-checkout__cardNumber"
                className="h-12 border rounded-md px-3 bg-white flex items-center"
                style={{ minHeight: '40px' }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="form-checkout__expirationDate">Validade</Label>
                <div
                  id="form-checkout__expirationDate"
                  className="h-12 border rounded-md px-3 bg-white flex items-center"
                  style={{ minHeight: '40px' }}
                ></div>
              </div>
              <div>
                <Label htmlFor="form-checkout__securityCode">CVV</Label>
                <div
                  id="form-checkout__securityCode"
                  className="h-12 border rounded-md px-3 bg-white flex items-center"
                  style={{ minHeight: '40px' }}
                ></div>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="form-checkout__cardholderName">
                Nome no cartão
              </Label>
              <Input
                id="form-checkout__cardholderName"
                type="text"
                placeholder="Nome como aparece no cartão"
                required
                disabled={processing}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="form-checkout__issuer">Banco emissor</Label>
              <select
                id="form-checkout__issuer"
                className="w-full h-10 border rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1">Visa/Master (outros)</option>
                <option value="24">Santander</option>
                <option value="1003">Banco do Brasil</option>
                <option value="1001">Banco Itaú</option>
                <option value="1004">Bradesco</option>
                <option value="1010">Caixa</option>
              </select>
            </div>

            <div className="mb-4">
              <Label htmlFor="form-checkout__installments">Parcelas</Label>
              <select
                id="form-checkout__installments"
                className="w-full h-10 border rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1">1x sem juros</option>
                <option value="2">2x sem juros</option>
                <option value="3">3x sem juros</option>
                <option value="4">4x sem juros</option>
              </select>
            </div>

            <div className="mb-4">
              <Label htmlFor="form-checkout__identificationType">
                Tipo de documento
              </Label>
              <select
                id="form-checkout__identificationType"
                className="w-full h-10 border rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>

            <div className="mb-4">
              <Label htmlFor="form-checkout__identificationNumber">
                Número do documento
              </Label>
              <Input
                id="form-checkout__identificationNumber"
                type="text"
                value="12345678909"
                placeholder="CPF"
                readOnly
                disabled={processing}
              />
            </div>

            <Button
              id="form-checkout__submit"
              type="submit"
              className="w-full h-12 rounded-full bg-black hover:bg-black/90"
              disabled={processing || fetchingResource || !isSDKLoaded}
            >
              {processing || fetchingResource ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </span>
              ) : (
                'Finalizar Pagamento'
              )}
            </Button>
          </form>

          <div className="text-xs text-gray-500 mt-2 text-center">
            Pagamento processado com segurança pelo Mercado Pago
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardForm;
