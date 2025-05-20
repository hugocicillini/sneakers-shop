import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as cartService from '@/services/cart.service';
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';

// Definição de contexto e estado inicial
const CartContext = createContext();

const initialState = {
  items: [],
  isOpen: false,
  loading: false,
  error: null,
  appliedCoupon: null,
};

// Types para as ações do reducer (melhora a manutenção)
const ACTION_TYPES = {
  SET_CART: 'SET_CART',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  REMOVE_ITEM_SUCCESS: 'REMOVE_ITEM_SUCCESS',
  UPDATE_QUANTITY_SUCCESS: 'UPDATE_QUANTITY_SUCCESS',
  CLEAR_CART_SUCCESS: 'CLEAR_CART_SUCCESS',
  TOGGLE_CART: 'TOGGLE_CART',
  SET_CART_OPEN: 'SET_CART_OPEN',
  SET_COUPON: 'SET_COUPON',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Reducer refatorado para gerenciar o carrinho
function cartReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_CART:
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      };

    case ACTION_TYPES.ADD_ITEM_SUCCESS:
      // Agora sempre esperamos o carrinho completo da API
      return {
        ...state,
        items: action.payload.items || state.items,
        loading: false,
      };

    case ACTION_TYPES.REMOVE_ITEM_SUCCESS:
      return {
        ...state,
        items:
          action.payload.items ||
          state.items.filter(
            (item) => item.cartItemId !== action.payload.cartItemId
          ),
        loading: false,
      };

    case ACTION_TYPES.UPDATE_QUANTITY_SUCCESS:
      return {
        ...state,
        items:
          action.payload.items ||
          state.items.map((item) =>
            item.cartItemId === action.payload.cartItemId
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
        loading: false,
      };

    case ACTION_TYPES.CLEAR_CART_SUCCESS:
      return { ...state, items: [], loading: false };

    case ACTION_TYPES.TOGGLE_CART:
      return { ...state, isOpen: !state.isOpen };

    case ACTION_TYPES.SET_CART_OPEN:
      return { ...state, isOpen: action.payload };

    case ACTION_TYPES.SET_COUPON:
      if (action.payload) {
        // Aplicando cupom - extraído para função auxiliar
        return applyCouponToState(state, action.payload);
      } else {
        // Removendo cupom - extraído para função auxiliar
        return removeCouponFromState(state);
      }

    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    default:
      throw new Error(`Ação não suportada: ${action.type}`);
  }
}

// Funções auxiliares para o reducer - melhora legibilidade
function applyCouponToState(state, couponData) {
  const { discountValue, discountType } = couponData;
  let totalDiscount = 0;

  const updatedItems = state.items.map((item) => {
    // Guardar o preço original se ainda não existir
    const originalPrice = item.originalPrice || item.price;
    let discountedPrice = originalPrice;

    // Calcular o preço com desconto
    if (discountType === 'percentage') {
      const itemDiscount = originalPrice * (discountValue / 100);
      discountedPrice = originalPrice - itemDiscount;
      // Acumular o desconto total considerando a quantidade
      totalDiscount += itemDiscount * item.quantity;
    } else if (discountType === 'fixed_amount') {
      const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
      const itemDiscount = discountValue / totalItems;
      discountedPrice = Math.max(0, originalPrice - itemDiscount);
      // Para descontos de valor fixo, usamos o valor diretamente
      totalDiscount = discountValue;
    }

    return {
      ...item,
      originalPrice,
      price: discountedPrice,
      hasDiscount: true,
    };
  });

  // Atualizar o valor do desconto no objeto do cupom
  const updatedCoupon = {
    ...couponData,
    discountAmount: parseFloat(totalDiscount.toFixed(2)),
  };

  return {
    ...state,
    appliedCoupon: updatedCoupon,
    items: updatedItems,
  };
}

function removeCouponFromState(state) {
  const restoredItems = state.items.map((item) => ({
    ...item,
    price: item.originalPrice || item.price,
    hasDiscount: false,
    originalPrice: undefined,
  }));

  return {
    ...state,
    appliedCoupon: null,
    items: restoredItems,
  };
}

// Provider do contexto do carrinho - refatorado
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const hasLoadedCart = useRef(false);

  // Função auxiliar para tratamento de erros - evita repetição
  const handleError = (error, customMessage = 'Ocorreu um erro') => {
    console.error(customMessage, error);
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
    toast({
      title: 'Erro',
      description: error.message || customMessage,
      variant: 'destructive',
    });
  };

  // Carregar o carrinho
  useEffect(() => {
    if (!isAuthenticated || hasLoadedCart.current) return;

    // Restaurar cupom salvo
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        dispatch({
          type: ACTION_TYPES.SET_COUPON,
          payload: JSON.parse(savedCoupon),
        });
      } catch (e) {
        localStorage.removeItem('appliedCoupon');
      }
    }

    const loadCart = async () => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      try {
        const cartData = await cartService.getCart();
        dispatch({
          type: ACTION_TYPES.SET_CART,
          payload: cartData.items || [],
        });
      } catch (error) {
        handleError(error, 'Erro ao carregar carrinho');
      }
    };

    loadCart();
    hasLoadedCart.current = true;
  }, [isAuthenticated]);

  // Lidar com logout - limpar carrinho
  useEffect(() => {
    if (user === null) {
      dispatch({ type: ACTION_TYPES.CLEAR_CART_SUCCESS });
      localStorage.removeItem('appliedCoupon');
    }
  }, [user]);

  // Sincronizar carrinho local com servidor após login
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const syncCartWithServer = async () => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      try {
        const localCart = JSON.parse(
          localStorage.getItem('cart') || '{"items":[]}'
        );

        if (!localCart.items?.length) {
          dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
          return;
        }

        await syncLocalItemsToServer(localCart.items);

        // Limpar o localStorage
        localStorage.removeItem('cart');

        // Buscar o carrinho atualizado
        const updatedCart = await cartService.getCart();
        dispatch({
          type: ACTION_TYPES.SET_CART,
          payload: updatedCart.items || [],
        });
      } catch (error) {
        handleError(error, 'Erro na sincronização do carrinho');
      } finally {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      }
    };

    syncCartWithServer();
  }, [isAuthenticated, user]);

  // Função para sincronizar itens locais - maior organização
  async function syncLocalItemsToServer(localItems) {
    let successCount = 0;

    for (const item of localItems) {
      try {
        const cleanItem = prepareItemForSync(item);
        const addResult = await cartService.addToCart(cleanItem);

        if (addResult.success) {
          successCount++;
        } else {
          console.warn(
            `Falha ao adicionar: ${addResult.error || 'Erro desconhecido'}`
          );
        }
      } catch (itemError) {
        console.error(
          `Erro ao processar item ${item.name || 'desconhecido'}:`,
          itemError
        );
      }
    }

    // Notificar o resultado da sincronização
    if (successCount > 0) {
      toast({
        title: 'Carrinho sincronizado',
        description: `${successCount} de ${localItems.length} itens foram transferidos para sua conta`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Falha na sincronização',
        description: 'Não foi possível transferir seus itens para o servidor',
        variant: 'destructive',
      });
    }

    return successCount;
  }

  // Prepara um item local para sincronização
  function prepareItemForSync(item) {
    // Verifica se um ID é um ObjectId válido do MongoDB
    const isValidObjectId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

    const price =
      parseFloat(item.price) || parseFloat(item.originalPrice) || 799.9;

    const cleanItem = {
      sneakerId: item.sneakerId,
      size: item.size,
      color: item.color,
      quantity: item.quantity || 1,
      name: item.name,
      price: price,
      image: item.image || 'https://via.placeholder.com/150',
      brand: typeof item.brand === 'object' ? item.brand.name : item.brand,
      slug: item.slug,
    };

    // Adicionar variantId apenas se for válido
    if (isValidObjectId(item.sizeId)) {
      cleanItem.variantId = item.sizeId;
    } else if (isValidObjectId(item.variantId)) {
      cleanItem.variantId = item.variantId;
    }

    return cleanItem;
  }

  // Função addItem otimizada e limpa (sem logs de depuração)
  const addItem = async (item) => {
    if (!item || !item.sneakerId) {
      toast({
        title: 'Erro',
        description: 'Dados do produto incompletos',
        variant: 'destructive',
      });
      return;
    }

    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

    try {
      // Buscar o carrinho atualizado do servidor
      const currentCart = await cartService.getCart();
      const currentItems = currentCart.items || [];

      // Normalizar valores para comparação segura
      const sneakerId = String(item.sneakerId);
      const size = String(item.size);
      const color = String(item.color || '').toLowerCase();

      // Verificação de duplicatas
      const existingItem = currentItems.find(
        (cartItem) =>
          String(cartItem.sneakerId) === sneakerId &&
          String(cartItem.size) === size &&
          String(cartItem.color || '').toLowerCase() === color
      );

      // Se encontrou item existente com ID, atualiza a quantidade
      if (existingItem && existingItem.cartItemId) {
        const newQuantity = existingItem.quantity + (item.quantity || 1);

        const updateResult = await cartService.updateCartItemQuantity(
          existingItem.cartItemId,
          newQuantity
        );

        if (updateResult.success) {
          // Buscar o carrinho atualizado após a modificação
          const updatedCart = await cartService.getCart();

          dispatch({
            type: ACTION_TYPES.SET_CART,
            payload: updatedCart.items || [],
          });

          toast({
            title: 'Quantidade atualizada',
            description: `Quantidade de ${
              item.name || 'produto'
            } atualizada no carrinho`,
            variant: 'success',
          });

          // Recalcular descontos se houver cupom aplicado
          if (state.appliedCoupon) {
            dispatch({
              type: ACTION_TYPES.SET_COUPON,
              payload: state.appliedCoupon,
            });
          }
        } else {
          throw new Error(updateResult.error || 'Erro ao atualizar quantidade');
        }
      } else {
        // Se item não existe ou não tem ID, adiciona como novo
        const itemToAdd = {
          ...item,
          price:
            parseFloat(item.price) || parseFloat(item.originalPrice) || 799.9,
        };

        // Se encontrou um item duplicado sem ID, ajustar a quantidade
        if (existingItem) {
          itemToAdd.quantity = existingItem.quantity + (item.quantity || 1);

          // Remover o item antigo sem ID, se possível
          try {
            if (existingItem._id) {
              await cartService.removeFromCart(existingItem._id);
            }
          } catch (removeError) {
            // Prosseguir mesmo se não conseguir remover o item antigo
          }
        }

        const result = await cartService.addToCart(itemToAdd);

        if (result.success) {
          // Buscar o carrinho atualizado após a adição
          const finalCart = await cartService.getCart();

          dispatch({
            type: ACTION_TYPES.SET_CART,
            payload: finalCart.items || [],
          });

          toast({
            title: 'Produto adicionado',
            description: `${item.name || 'Produto'} foi adicionado ao carrinho`,
            variant: 'success',
          });

          // Recalcular descontos se houver cupom aplicado
          if (state.appliedCoupon) {
            dispatch({
              type: ACTION_TYPES.SET_COUPON,
              payload: state.appliedCoupon,
            });
          }
        } else {
          throw new Error(result.error || 'Erro ao adicionar produto');
        }
      }
    } catch (error) {
      handleError(error, 'Erro ao adicionar produto ao carrinho');
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Remover item do carrinho - refatorado
  const removeItem = async (cartItemId) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

    try {
      const result = await cartService.removeFromCart(cartItemId);

      if (result.success) {
        dispatch({
          type: ACTION_TYPES.REMOVE_ITEM_SUCCESS,
          payload: {
            cartItemId,
            ...(result.cart || {}),
          },
        });

        toast({
          title: 'Item removido',
          description: 'Item removido do carrinho com sucesso',
        });

        // Recalcular descontos se houver cupom aplicado
        if (state.appliedCoupon) {
          dispatch({
            type: ACTION_TYPES.SET_COUPON,
            payload: state.appliedCoupon,
          });
        }
      } else {
        throw new Error(result.error || 'Erro ao remover item');
      }
    } catch (error) {
      handleError(error, 'Erro ao remover item do carrinho');
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Atualizar quantidade - refatorado
  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) return;

    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

    try {
      const result = await cartService.updateCartItemQuantity(
        cartItemId,
        quantity
      );

      if (result.success) {
        dispatch({
          type: ACTION_TYPES.UPDATE_QUANTITY_SUCCESS,
          payload: {
            cartItemId,
            quantity,
            ...(result.cart || {}),
          },
        });

        // Recalcular descontos se houver cupom aplicado
        if (state.appliedCoupon) {
          dispatch({
            type: ACTION_TYPES.SET_COUPON,
            payload: state.appliedCoupon,
          });
        }
      } else {
        throw new Error(result.error || 'Erro ao atualizar quantidade');
      }
    } catch (error) {
      handleError(error, 'Erro ao atualizar quantidade');
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Limpar o carrinho - refatorado
  const clearCart = async () => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

    try {
      const result = await cartService.clearCart();

      if (result.success) {
        dispatch({ type: ACTION_TYPES.CLEAR_CART_SUCCESS });

        // Também removemos qualquer cupom aplicado
        localStorage.removeItem('appliedCoupon');

        toast({
          title: 'Carrinho esvaziado',
          description: 'Todos os produtos foram removidos',
        });
      } else {
        throw new Error(result.error || 'Erro ao esvaziar carrinho');
      }
    } catch (error) {
      handleError(error, 'Erro ao limpar o carrinho');
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Função para resetar o carrinho localmente
  const resetCart = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_CART_SUCCESS });
    localStorage.removeItem('appliedCoupon');
  };

  // Aplicar cupom - refatorado
  const applyCoupon = (couponData) => {
    if (couponData) {
      // Se estamos aplicando um cupom novo, garantimos que ele tenha
      // os dados básicos mesmo se não for calculado imediatamente
      const preparedCoupon = {
        ...couponData,
        discountAmount: couponData.discountAmount || 0,
      };

      dispatch({ type: ACTION_TYPES.SET_COUPON, payload: preparedCoupon });
      localStorage.setItem('appliedCoupon', JSON.stringify(preparedCoupon));

      toast({
        title: 'Cupom aplicado',
        description: `Cupom ${preparedCoupon.code} aplicado com sucesso`,
        variant: 'success',
      });
    } else {
      dispatch({ type: ACTION_TYPES.SET_COUPON, payload: null });
      localStorage.removeItem('appliedCoupon');
    }
  };

  // Funções para controlar visibilidade do carrinho
  const toggleCart = () => dispatch({ type: ACTION_TYPES.TOGGLE_CART });
  const setCartOpen = (isOpen) =>
    dispatch({ type: ACTION_TYPES.SET_CART_OPEN, payload: isOpen });

  // Cálculos de valores totais - refatorados para maior segurança
  const cartCount = state.items.reduce((total, item) => {
    const quantity = parseInt(item?.quantity) || 0;
    return total + (quantity > 0 ? quantity : 0);
  }, 0);

  const subtotal = state.items
    .reduce((total, item) => {
      const price = parseFloat(item?.price) || 0;
      const quantity = parseInt(item?.quantity) || 0;
      const itemTotal = price * quantity;
      return total + (itemTotal > 0 ? itemTotal : 0);
    }, 0)
    .toFixed(2);

  const pixDiscount = parseFloat((parseFloat(subtotal) * 0.05).toFixed(2));

  const couponDiscount = state.appliedCoupon
    ? parseFloat(state.appliedCoupon.discountAmount || 0)
    : 0;

  const totalWithDiscounts = Math.max(
    0,
    parseFloat((parseFloat(subtotal) - pixDiscount - couponDiscount).toFixed(2))
  );

  // Valores e funções disponíveis no contexto
  const value = {
    items: state.items,
    isOpen: state.isOpen,
    loading: state.loading,
    error: state.error,
    cartCount,
    subtotal,
    pixDiscount,
    couponDiscount,
    totalWithDiscounts,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    resetCart,
    applyCoupon,
    appliedCoupon: state.appliedCoupon,
    toggleCart,
    setCartOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook para acessar o contexto do carrinho
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
