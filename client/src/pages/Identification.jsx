import AddressCard from '@/components/checkout/AddressCard';
import OrderSummary from '@/components/checkout/OrderSummary';
import ShippingMethodCard from '@/components/checkout/ShippingMethodCard';
import UserInfoCard from '@/components/checkout/UserInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutCheckout from '@/layout/LayoutCheckout';
import {
  createUserAddress,
  updateUserAddress,
} from '@/services/addresses.service';
import { getUser, updateUser } from '@/services/users.service';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useAddressManagement = () => {
  const [address, setAddress] = useState(null);

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

const useShippingMethods = (navigate, subtotal, couponDiscount) => {
  const [selectedShippingOption, setSelectedShippingOption] =
    useState('normal');
  const [shippingMethods, setShippingMethods] = useState([]);

  useEffect(() => {
    const subtotalValue = parseFloat(subtotal) || 0;
    const couponValue = parseFloat(couponDiscount) || 0;
    const totalWithCoupon = subtotalValue - couponValue;

    const isFreeShipping =
      totalWithCoupon >=
      parseFloat(import.meta.env.VITE_FREE_SHIPPING_PRICE || 300);

    setShippingMethods([
      {
        id: 'normal',
        name: 'PAC',
        description: '4 dias úteis',
        price: isFreeShipping ? 0 : 19.9,
        originalPrice: 19.9,
        selected: true,
        isFreeShipping: isFreeShipping,
      },
      {
        id: 'express',
        name: 'Sedex',
        description: '2 dias úteis',
        price: 29.9,
        originalPrice: 29.9,
        selected: false,
        isFreeShipping: false,
      },
    ]);
  }, [subtotal, couponDiscount]);

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
        isFreeShipping: selectedMethod?.isFreeShipping || false,
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

const Identification = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const {
    items,
    subtotal,
    totalWithDiscounts,
    appliedCoupon,
    couponDiscount,
    calculatePixDiscount,
  } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [formattedUserData, setFormattedUserData] = useState(null);

  const { address, processUserData } = useAddressManagement();

  const {
    selectedShippingOption,
    shippingMethods,
    handleShippingMethodChange,
    handleContinue,
  } = useShippingMethods(navigate, subtotal, couponDiscount);

  const formatUserDataForProfile = useCallback((userData) => {
    return {
      data: {
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
      },
    };
  }, []);

  const handleUserUpdate = async (updatedUserData) => {
    try {
      const response = await updateUser(updatedUserData);

      if (response.success) {
        const newUserData =
          response.data || response.user?.data || response.user;

        setUserData(newUserData);
        setFormattedUserData(formatUserDataForProfile(newUserData));

        setUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            user: {
              ...prevUser.user,
              ...newUserData,
            },
          };

          try {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('✅ LocalStorage atualizado:', updatedUser);
          } catch (error) {
            console.error('❌ Erro ao atualizar localStorage:', error);
          }

          return updatedUser;
        });

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
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout/identification');
      return;
    }

    if (!items || items.length === 0) {
      navigate('/checkout/cart');
      return;
    }

    const allowIdentification = sessionStorage.getItem('allowIdentification');
    if (!allowIdentification) {
      navigate('/checkout/cart');
      return;
    }
  }, [isAuthenticated, items, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await getUser();
        const userData = processUserData(response);
        if (userData) {
          setUserData(userData);
          setFormattedUserData(formatUserDataForProfile(userData));
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
  }, [isAuthenticated, processUserData, formatUserDataForProfile]);

  const handleAddressUpdated = async (addressId, addressData) => {
    setLoading(true);
    try {
      const operation = addressId
        ? updateUserAddress(addressId, addressData)
        : createUserAddress(addressData);

      const response = await operation;

      if (response.success) {
        const userResponse = await getUser();
        const userData = processUserData(userResponse);
        if (userData) {
          setUserData(userData);
          setFormattedUserData(formatUserDataForProfile(userData));
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
              subtotal={subtotal}
              couponDiscount={couponDiscount}
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
              totalWithDiscounts={totalWithDiscounts}
              shippingMethod={selectedShippingMethod}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              calculatePixDiscount={calculatePixDiscount}
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
