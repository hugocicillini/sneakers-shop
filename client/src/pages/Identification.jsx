import AddressDialog from '@/components/Addresses';
import ProfileDialog from '@/components/Profile';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { updateUserAddress } from '@/services/addresses.service';
import { getUser, updateUser } from '@/services/users.service';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Identification = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [address, setAddress] = useState(null);
  const [selectedShippingOption, setSelectedShippingOption] =
    useState('normal');
  const [shippingMethods, setShippingMethods] = useState([
    {
      id: 'normal',
      name: 'Normal - Frete Grátis',
      description: '4 dias úteis',
      price: 0,
      selected: true,
    },
    {
      id: 'express',
      name: 'Entrega Expressa',
      description: '2 dias úteis',
      price: 15.9,
      selected: false,
    },
  ]);

  // Carregar dados do usuário incluindo o endereço padrão
  useEffect(() => {
    // Evitar redirecionamento prematuro durante carregamento da autenticação
    // Se user é null, ainda está carregando; se é undefined, realmente não está autenticado
    if (user === undefined && !isAuthenticated) {
      navigate('/login?redirect=/checkout/identification');
      return;
    }

    // Só buscar dados se realmente estiver autenticado
    if (isAuthenticated) {
      const fetchUserData = async () => {
        setLoading(true);
        try {
          // Inicializar com os dados básicos do contexto de autenticação
          setUserData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
          });

          // Buscar dados completos do usuário da API, incluindo o endereço padrão
          const response = await getUser();
          if (response.success) {
            setUserData(response.user);

            // Verificar se o usuário tem um endereço padrão
            if (response.user.defaultAddress) {
              setAddress(response.user.defaultAddress);
            }
          } else {
            console.error('Erro ao buscar dados do usuário:', response.message);
          }
        } catch (error) {
          console.error('Erro ao obter dados do usuário:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [isAuthenticated, navigate, items, user]);
  // Handler para atualização do endereço
  const handleAddressUpdated = async (addressId, addressData) => {
    try {
      const response = await updateUserAddress(addressId, addressData);

      if (!response.success) {
        toast({
          title: 'Erro ao atualizar endereço',
          description: response.message || 'Falha ao atualizar endereço.',
          variant: 'destructive',
        });
        return;
      }

      // Atualizar o endereço no estado local
      setAddress(response.address);

      toast({
        title: 'Endereço atualizado',
        description: 'Endereço atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    }
  };

  // Handler para atualização de dados do usuário
  const handleUserUpdated = async (updatedUserData) => {
    try {
      const response = await updateUser(updatedUserData); // Use seu serviço de atualização de usuário

      if (!response.success) {
        toast({
          title: 'Erro ao atualizar perfil',
          description:
            response.message || 'Não foi possível atualizar seu perfil.',
          variant: 'destructive',
        });
      } else {
        // Atualizar dados do usuário
        setUserData(response.user);

        // Atualizar o estado global do usuário
        setUser((prevUser) => ({
          ...prevUser,
          ...response.user,
        }));

        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas com sucesso!',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    }
  };

  // Função para lidar com a mudança do método de entrega
  const handleShippingMethodChange = (value) => {
    setSelectedShippingOption(value);
    setShippingMethods(
      shippingMethods.map((m) => ({
        ...m,
        selected: m.id === value,
      }))
    );
  };

  const handleContinue = () => {
    if (!address) {
      toast({
        title: 'Endereço necessário',
        description:
          'Por favor, adicione um endereço de entrega antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    // Implementar a lógica de salvar o endereço e método de entrega antes de avançar
    navigate('/checkout/payment');
  };

  // Se não estiver autenticado, será redirecionado pelo useEffect
  if (!isAuthenticated) {
    return null;
  }

  const selectedShippingMethod = shippingMethods.find(
    (method) => method.selected
  );
  const totalWithShipping =
    parseFloat(subtotal) + (selectedShippingMethod?.price || 0);
  const pixDiscount = totalWithShipping * 0.05;
  const totalWithPixDiscount = totalWithShipping - pixDiscount;

  return (
    <LayoutCheckout activeStep={2}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Dados de identificação com opção de editar */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Seus dados</h2>
                {/* Corrigido: passar userData e setUserData para o componente */}
                <ProfileDialog
                  onUserUpdated={handleUserUpdated}
                  userData={userData}
                  setUserData={setUserData}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome completo</p>
                  <p className="font-medium">
                    {userData?.name || 'Não disponível'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">E-mail</p>
                  <p className="font-medium">
                    {userData?.email || 'Não disponível'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{userData?.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Escolha do tipo de entrega */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">
                Escolha o tipo de entrega
              </h2>

              <RadioGroup
                value={selectedShippingOption}
                onValueChange={handleShippingMethodChange}
              >
                {shippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center space-x-3 border rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleShippingMethodChange(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <label
                          htmlFor={method.id}
                          className="font-medium cursor-pointer"
                        >
                          {method.name}
                        </label>
                        <p className="text-sm text-gray-500">
                          {method.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {method.price > 0 ? (
                          <span className="font-semibold">
                            R$ {method.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-green-600 font-semibold">
                            GRÁTIS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Endereço de entrega */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Endereço de entrega</h2>
              </div>

              {loading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : !address ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">
                    Nenhum endereço padrão configurado
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/account')}>
                    Configurar endereço na conta
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {address.type || 'Endereço de Entrega'}
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                          Padrão
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {address.street}, {address.number}{' '}
                        {address.complement && `- ${address.complement}`} <br />
                        {address.neighborhood} - {address.city}, {address.state}{' '}
                        <br />
                        CEP: {address.zipCode}
                      </p>
                    </div>

                    {/* Dialog para editar endereço */}
                    <AddressDialog
                      address={address}
                      onAddressUpdated={handleAddressUpdated}
                      isEditing={true}
                      isInCheckout={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo da compra */}
          <div className="space-y-6">
            {/* Produtos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Resumo do pedido</h2>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center space-x-3"
                  >
                    <img
                      src={item.image || 'https://via.placeholder.com/80'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Tamanho: {item.size} | Cor: {item.color}
                      </p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Qtd: {item.quantity}
                        </span>
                        <span className="text-sm font-medium">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo dos valores */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    Produtos ({items.length}{' '}
                    {items.length === 1 ? 'item' : 'itens'})
                  </span>
                  <span>R$ {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  {selectedShippingMethod?.price > 0 ? (
                    <span>R$ {selectedShippingMethod.price.toFixed(2)}</span>
                  ) : (
                    <span className="text-green-600">GRÁTIS</span>
                  )}
                </div>
                <div className="border-t my-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {totalWithShipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Com Pix (5% off)</span>
                  <span>R$ {totalWithPixDiscount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6 h-12 text-base font-semibold rounded-full bg-black hover:bg-black/90"
                onClick={handleContinue}
                disabled={!address || loading}
              >
                Continuar para o pagamento
              </Button>

              <Button
                variant="link"
                className="w-full mt-2 text-sm"
                onClick={() => navigate('/checkout/cart')}
              >
                Voltar ao carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LayoutCheckout>
  );
};

export default Identification;
