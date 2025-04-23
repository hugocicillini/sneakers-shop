import AddressDialog from '@/components/Addresses';
import ProfileDialog from '@/components/Profile';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import {
  addUserAddress,
  deleteUserAddress,
  updateUserAddress,
} from '@/services/addresses.service';
import { updateUser } from '@/services/users.service';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useState } from 'react';

const Account = () => {
  const { user, updateUserState } = useAuth();
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orders, setOrders] = useState([
    {
      id: '12345',
      date: '2023-10-01',
      status: 'Entregue',
      items: [
        {
          name: 'Produto 1',
          color: 'Vermelho',
          size: 'M',
          quantity: 2,
          price: 49.99,
        },
        {
          name: 'Produto 2',
          color: 'Azul',
          size: 'G',
          quantity: 1,
          price: 79.99,
        },
      ],
      total: 179.97,
    },
    {
      id: '12346',
      date: '2023-10-02',
      status: 'Em Trânsito',
      items: [
        {
          name: 'Produto 3',
          color: 'Preto',
          size: 'P',
          quantity: 1,
          price: 29.99,
        },
        {
          name: 'Produto 4',
          color: 'Branco',
          size: 'M',
          quantity: 3,
          price: 19.99,
        },
      ],
      total: 89.96,
    },
  ]);
  const [loading, setLoading] = useState(true);

  const handleUserUpdated = async (updatedUserData) => {
    try {
      // Chamar diretamente o serviço de atualização
      const response = await updateUser(user._id, updatedUserData);

      if (!response.success) {
        toast({
          title: 'Erro ao atualizar perfil',
          description:
            response.message || 'Não foi possível atualizar seu perfil.',
          variant: 'destructive',
        });
      } else {
        // Garantir que os endereços existentes são preservados
        // Criar um novo objeto de usuário combinando os dados da resposta com os endereços existentes
        const updatedUserWithAddresses = {
          ...response.user,
          // Preservar explicitamente os endereços existentes se não estiverem na resposta
          addresses: response.user.addresses || user.addresses,
        };

        // Atualizar o estado do usuário usando updateUserState com o objeto completo
        updateUserState(updatedUserWithAddresses, { merge: false });

        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas com sucesso!',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const handleAddressUpdated = async (addressId, updatedAddress, isEditing) => {
    try {
      let response;

      if (isEditing) {
        // Atualizar endereço existente chamando diretamente o serviço
        response = await updateUserAddress(addressId, updatedAddress);

        if (!response.success) {
          toast({
            title: 'Erro ao atualizar endereço',
            description:
              response.message || 'Não foi possível atualizar o endereço.',
            variant: 'destructive',
          });
          return;
        }

        // Criar um novo objeto de usuário
        const updatedUser = { ...user };

        // Atualizar o endereço específico no array
        updatedUser.addresses = updatedUser.addresses.map((addr) => {
          // Se este é o endereço sendo editado
          if (addr._id === addressId) {
            return response.address;
          }
          // Se este NÃO é o endereço sendo editado, mas o novo endereço é marcado como padrão
          // e o endereço atual também é padrão, desmarcamos este
          if (updatedAddress.isDefault && addr.isDefault) {
            return { ...addr, isDefault: false };
          }
          // Caso contrário, manter o endereço como está
          return addr;
        });

        // Uma única atualização do estado do usuário
        updateUserState(updatedUser);

        toast({
          title: 'Endereço atualizado',
          description: 'Seu endereço foi atualizado com sucesso!',
          variant: 'success',
        });
      } else {
        // Adicionar novo endereço chamando diretamente o serviço
        response = await addUserAddress(user._id, updatedAddress);

        if (!response.success) {
          toast({
            title: 'Erro ao adicionar endereço',
            description:
              response.message || 'Não foi possível adicionar o endereço.',
            variant: 'destructive',
          });
          return;
        }

        // Atualizar o estado global com o novo endereço
        const updatedUser = { ...user };
        updatedUser.addresses = [...updatedUser.addresses, response.address];

        // Atualizar o estado do usuário com updateUserState
        updateUserState(updatedUser);

        toast({
          title: 'Endereço adicionado',
          description: 'Seu novo endereço foi adicionado com sucesso!',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Erro ao processar endereço:', error);
      toast({
        title: 'Erro inesperado',
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

      console.log('Resposta da exclusão:', response);

      // Atualizar o estado do usuário removendo o endereço excluído
      const updatedUser = { ...user };

      // Filtrar o endereço excluído
      updatedUser.addresses = updatedUser.addresses.filter(
        (addr) => addr._id !== addressId
      );

      // Se um novo endereço padrão foi definido, atualize os estados dos endereços
      if (response.newDefaultAddress) {
        console.log(
          'Novo endereço padrão recebido:',
          response.newDefaultAddress
        );

        // Atualizar o estado isDefault para o novo endereço padrão
        updatedUser.addresses = updatedUser.addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === response.newDefaultAddress._id,
        }));
      }

      // Atualizar o estado do usuário
      updateUserState(updatedUser);

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

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <LayoutBase>
      <div className="mx-auto w-4/5 py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 flex justify-between items-center">
          <span>Minha Conta</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Card de Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Dados Pessoais</span>
                  <ProfileDialog onUserUpdated={handleUserUpdated} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p>{user?.name || 'Nome do usuário'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{user?.email || 'email@exemplo.com'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Telefone
                    </p>
                    <p>{user?.phone || '(11) 99999-9999'}</p>
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
                {user.addresses.length > 0 ? (
                  <div className="space-y-4 pt-2 overflow-y-auto max-h-96">
                    {/* Ordenar endereços para colocar o padrão primeiro */}
                    {user.addresses
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
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border">
                        <CardHeader
                          className="py-4 cursor-pointer"
                          onClick={() => toggleOrderExpand(order.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Pedido #{order.id}</p>
                              <p className="text-sm text-gray-500">
                                {order.date}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-sm px-2 py-1 rounded ${
                                  order.status === 'Entregue'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {order.status}
                              </span>
                              {expandedOrders[order.id] ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {expandedOrders[order.id] && (
                          <>
                            <CardContent className="pt-0">
                              <div className="border-t my-2"></div>
                              <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <div>
                                      <p>{item.name}</p>
                                      <p className="text-sm text-gray-500">
                                        {item.color}, Tamanho: {item.size}, Qtd:{' '}
                                        {item.quantity}
                                      </p>
                                    </div>
                                    <p className="font-medium">
                                      R$ {item.price.toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                              <span className="font-bold">Total</span>
                              <span className="font-bold">
                                R$ {order.total.toFixed(2)}
                              </span>
                            </CardFooter>
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-10 text-gray-500">
                    Você ainda não possui pedidos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Account;
