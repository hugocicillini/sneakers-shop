import AddressCard from '@/components/checkout/AddressCard';
import OrderSummary from '@/components/checkout/OrderSummary';
import ShippingMethodCard from '@/components/checkout/ShippingMethodCard';
import UserInfoCard from '@/components/checkout/UserInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import { createAddress, updateUserAddress } from '@/services/addresses.service';
import { getUser, updateUser } from '@/services/users.service';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hook para gerenciar perfil do usuário
const useUserProfile = (setUser) => {
  const [userData, setUserData] = useState(null);
  const [formattedUserData, setFormattedUserData] = useState(null);

  // Formatar dados para o perfil
  const formatUserDataForProfile = useCallback((userData) => {
    return {
      data: {
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
      },
    };
  }, []);

  // Atualizar dados do usuário no estado
  const updateUserState = useCallback(
    (userData) => {
      setUserData(userData);
      setFormattedUserData(formatUserDataForProfile(userData));
    },
    [formatUserDataForProfile]
  );

  // Processar atualização de perfil
  const handleUserUpdate = async (updatedUserData) => {
    try {
      const response = await updateUser(updatedUserData);
      if (response.success) {
        const userData = response.data || response.user?.data || response.user;
        updateUserState(userData);

        // Atualizar contexto global
        setUser((prevUser) => ({
          ...prevUser,
          ...userData,
        }));

        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas com sucesso!',
        });
        return true;
      } else {
        toast({
          title: 'Erro ao atualizar perfil',
          description:
            response.message || 'Não foi possível atualizar seu perfil.',
          variant: 'destructive',
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
    return false;
  };

  return {
    userData,
    formattedUserData,
    updateUserState,
    handleUserUpdate,
    formatUserDataForProfile,
  };
};

// Hook para gerenciar endereços
const useAddressManagement = (formatUserDataForProfile) => {
  const [address, setAddress] = useState(null);

  // Extrair informações de endereço da resposta da API
  const processUserData = useCallback((response) => {
    if (!response.success) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível buscar suas informações',
        variant: 'destructive',
      });
      return null;
    }

    const userData = response.data || response.user?.data || response.user;

    // Determinar o endereço a ser usado
    if (userData.defaultAddress) {
      setAddress(userData.defaultAddress);
    } else if (userData.addresses?.length > 0) {
      const defaultAddress =
        userData.addresses.find((addr) => addr.isDefault) ||
        userData.addresses[0];
      setAddress(defaultAddress);
    }

    return userData;
  }, []);

  return {
    address,
    setAddress,
    processUserData,
  };
};

// Hook para gerenciar métodos de envio
const useShippingMethods = (navigate) => {
  const [selectedShippingOption, setSelectedShippingOption] =
    useState('normal');
  const [shippingMethods] = useState([
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

  const handleShippingMethodChange = useCallback((value) => {
    setSelectedShippingOption(value);
  }, []);

  const handleContinue = useCallback(
    (address) => {
      if (!address) {
        toast({
          title: 'Endereço necessário',
          description:
            'Por favor, adicione um endereço de entrega antes de continuar.',
          variant: 'destructive',
        });
        return;
      }

      const selectedMethod = shippingMethods.find(
        (method) => method.id === selectedShippingOption
      );
      const shippingInfo = {
        address: address,
        method: selectedShippingOption,
        cost: selectedMethod?.price || 0,
      };

      sessionStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
      navigate('/checkout/payment');
    },
    [shippingMethods, selectedShippingOption, navigate]
  );

  return {
    selectedShippingOption,
    shippingMethods,
    handleShippingMethodChange,
    handleContinue,
  };
};

// Componente principal
const Identification = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Inicializar hooks personalizados
  const {
    userData,
    formattedUserData,
    updateUserState,
    handleUserUpdate,
    formatUserDataForProfile,
  } = useUserProfile(setUser);
  const { address, processUserData } = useAddressManagement(
    formatUserDataForProfile
  );
  const {
    selectedShippingOption,
    shippingMethods,
    handleShippingMethodChange,
    handleContinue,
  } = useShippingMethods(navigate);

  // Buscar dados do usuário e endereço
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout/identification');
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await getUser();
        const userData = processUserData(response);
        if (userData) {
          updateUserState(userData);
        }
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        toast({
          title: 'Erro inesperado',
          description: 'Ocorreu um problema ao carregar seus dados',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, navigate, user, processUserData, updateUserState]);

  // Função para atualizar endereço
  const handleAddressUpdated = async (addressId, addressData) => {
    setLoading(true);
    try {
      // Executar a operação de criação ou atualização
      const operation = addressId
        ? updateUserAddress(addressId, addressData)
        : createAddress(addressData);

      const response = await operation;

      if (response.success) {
        // Recarregar dados atualizados
        const userResponse = await getUser();
        const userData = processUserData(userResponse);
        if (userData) {
          updateUserState(userData);
        }

        toast({
          title: addressId ? 'Endereço atualizado' : 'Endereço adicionado',
          description: `Endereço ${
            addressId ? 'atualizado' : 'adicionado'
          } com sucesso!`,
        });
      } else {
        toast({
          title: `Erro ao ${addressId ? 'atualizar' : 'adicionar'} endereço`,
          description:
            response.message ||
            `Falha ao ${addressId ? 'atualizar' : 'adicionar'} endereço.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(
        `Erro ao ${addressId ? 'atualizar' : 'adicionar'} endereço:`,
        error
      );
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const selectedShippingMethod = shippingMethods.find(
    (method) => method.id === selectedShippingOption
  );

  return (
    <LayoutCheckout activeStep={2}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <UserInfoCard
              userData={userData}
              onUserUpdated={handleUserUpdate}
              formattedUserData={formattedUserData}
            />

            <ShippingMethodCard
              methods={shippingMethods}
              selectedValue={selectedShippingOption}
              onChange={handleShippingMethodChange}
            />

            <AddressCard
              address={address}
              loading={loading}
              onAddressUpdated={handleAddressUpdated}
              onNavigateToAccount={() => navigate('/account')}
              isInCheckout={true}
            />
          </div>

          <div className="md:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingMethod={selectedShippingMethod}
              onContinue={() => handleContinue(address)}
              onBack={() => navigate('/checkout/cart')}
              disableContinue={!address || loading}
            />
          </div>
        </div>
      </div>
    </LayoutCheckout>
  );
};

export default Identification;
