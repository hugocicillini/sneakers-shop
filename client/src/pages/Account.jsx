import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AddressDialog from '@/components/user/Addresses';
import OrderList from '@/components/user/Order';
import ProfileDialog from '@/components/user/Profile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import {
  createUserAddress,
  deleteUserAddress,
  getUserAddresses,
  updateUserAddress,
} from '@/services/addresses.service';
import { getUserOrders } from '@/services/order.service';
import { getUser, updateUser } from '@/services/users.service';
import { Loader2, Package } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const Account = () => {
  const { user, updateUserData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user || hasFetchedRef.current) {
        setLoading(false);
        return;
      }

      hasFetchedRef.current = true;
      setLoading(true);

      try {
        // Fazer todas as chamadas da API de forma concorrente
        const [userResponse, addressResponse, ordersResponse] =
          await Promise.all([getUser(), getUserAddresses(), getUserOrders()]);

        // Processar resposta dos dados do usuário
        if (userResponse.success && userResponse.user) {
          setUserData(userResponse.user);
        } else {
          toast({
            title: 'Erro ao carregar dados',
            description: 'Não foi possível carregar seus dados pessoais.',
            variant: 'destructive',
          });
        }

        // Processar resposta dos endereços
        if (addressResponse.success) {
          setAddresses(addressResponse.data || []);
        } else {
          toast({
            title: 'Erro ao carregar endereços',
            description:
              addressResponse.message ||
              'Não foi possível carregar seus endereços.',
            variant: 'destructive',
          });
          setAddresses([]);
        }

        // Processar resposta dos pedidos
        if (ordersResponse.success) {
          setOrders(ordersResponse.data || []);
        } else {
          toast({
            title: 'Erro ao buscar pedidos',
            description:
              ordersResponse.message ||
              'Não foi possível carregar seus pedidos.',
            variant: 'destructive',
          });
          setOrders([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: 'Erro de conexão',
          description:
            'Não foi possível carregar seus dados. Verifique sua conexão.',
          variant: 'destructive',
        });
        // Limpar estados em caso de erro
        setAddresses([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user]);

  const handleUserUpdated = async (updatedUserData) => {
    try {
      const response = await updateUser(updatedUserData);

      if (!response.success) {
        toast({
          title: 'Erro ao atualizar perfil',
          description:
            response.message || 'Não foi possível atualizar seu perfil.',
          variant: 'destructive',
        });
      } else {
        setUserData(response.user);

        updateUserData(response.user);

        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas com sucesso!',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const handleAddressUpdated = async (addressId, addressData, isEditing) => {
    try {
      if (isEditing) {
        const response = await updateUserAddress(addressId, addressData);

        if (!response.success) {
          toast({
            title: 'Erro ao atualizar endereço',
            description: response.message || 'Falha ao atualizar endereço.',
            variant: 'destructive',
          });
          return;
        }

        const refreshResponse = await getUserAddresses();
        if (refreshResponse.success) {
          setAddresses(refreshResponse.data || []);
        }

        toast({
          title: 'Endereço atualizado',
          description: 'Endereço atualizado com sucesso!',
          variant: 'success',
        });
      } else {
        const response = await createUserAddress(addressData);

        if (!response.success) {
          toast({
            title: 'Erro ao adicionar endereço',
            description: response.message || 'Falha ao adicionar endereço.',
            variant: 'destructive',
          });
          return;
        }

        const refreshResponse = await getUserAddresses();
        if (refreshResponse.success) {
          setAddresses(refreshResponse.data || []);
        }

        toast({
          title: 'Endereço adicionado',
          description: 'Endereço adicionado com sucesso!',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    }
  };

  const handleAddressDeleted = async (addressId) => {
    try {
      const response = await deleteUserAddress(addressId);

      if (!response.success) {
        toast({
          title: 'Erro ao excluir endereço',
          description:
            response.message || 'Não foi possível excluir o endereço.',
          variant: 'destructive',
        });
        return;
      }

      setAddresses((prevAddresses) => {
        let filteredAddresses = prevAddresses.filter(
          (addr) => addr._id !== addressId
        );

        // Se um novo endereço padrão foi definido, atualize os estados dos endereços
        if (response.newDefaultAddress) {
          filteredAddresses = filteredAddresses.map((addr) => ({
            ...addr,
            isDefault: addr._id === response.newDefaultAddress._id,
          }));
        }

        return filteredAddresses;
      });

      toast({
        title: 'Endereço excluído',
        description: 'O endereço foi removido com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <LayoutBase>
      <div className="mx-auto w-4/5 py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 flex justify-between items-center">
          <span>Minha Conta</span>
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-gray-600">Carregando seus dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* Card de Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Dados Pessoais</span>
                    <ProfileDialog
                      onUserUpdated={handleUserUpdated}
                      userData={userData}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p>
                        {userData?.data?.name ||
                          userData?.name ||
                          'Nome do usuário'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p>
                        {userData?.data?.email ||
                          userData?.email ||
                          'email@exemplo.com'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Telefone
                      </p>
                      <p>
                        {userData?.data?.phone ||
                          userData?.phone ||
                          '(00) 0000-0000'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Endereços */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Meus Endereços</span>
                    <AddressDialog onAddressUpdated={handleAddressUpdated} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-4 pt-2 overflow-y-auto max-h-96">
                      {/* Ordenar endereços para colocar o padrão primeiro */}
                      {addresses
                        .sort(
                          (a, b) =>
                            (b.isDefault === true) - (a.isDefault === true)
                        )
                        .map((address) => (
                          <div
                            key={address._id}
                            className={`p-4 border rounded-md relative ${
                              address.isDefault
                                ? 'border-primary border-2 bg-primary/5'
                                : 'border-gray-200'
                            }`}
                          >
                            {/* Badge para endereço padrão */}
                            {address.isDefault && (
                              <span className="absolute top-0 right-2 transform translate-x-1 -translate-y-1/2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                Padrão
                              </span>
                            )}

                            <div className="flex justify-between mb-2">
                              <span
                                className={`font-medium ${
                                  address.isDefault ? 'text-primary' : ''
                                }`}
                              >
                                {address.type}
                              </span>
                              <div>
                                <AddressDialog
                                  address={address}
                                  onAddressUpdated={handleAddressUpdated}
                                  onAddressDeleted={handleAddressDeleted}
                                  isEditing={true}
                                />
                              </div>
                            </div>

                            <p className="text-sm text-gray-600">
                              {address.street}, {address.number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.neighborhood}, {address.city} -{' '}
                              {address.state}
                            </p>
                            <p className="text-sm text-gray-600">
                              CEP: {address.zipCode}
                            </p>
                            <p className="text-sm text-gray-600">
                              Destinatário: {address.recipient}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-gray-500">
                      Você ainda não possui endereços cadastrados
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2: Pedidos (2/3 da largura) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package size={20} />
                    Meus Pedidos
                  </CardTitle>
                  <CardDescription>Histórico dos seus pedidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <OrderList orders={orders} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </LayoutBase>
  );
};

export default Account;
