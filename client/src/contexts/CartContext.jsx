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

// Reducer simplificado para gerenciar o carrinho
function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload, loading: false, error: null };

    case 'ADD_ITEM_SUCCESS':
      // Se recebemos o carrinho completo, usamos ele
      if (action.payload.cart?.items) {
        return { ...state, items: action.payload.cart.items, loading: false };
      }
      // Caso contrário, adicionamos apenas o novo item
      return {
        ...state,
        items: [...state.items, action.payload.item],
        loading: false,
      };

    case 'REMOVE_ITEM_SUCCESS':
      // Se recebemos o carrinho atualizado, usamos ele
      if (action.payload?.items) {
        return { ...state, items: action.payload.items, loading: false };
      }
      // Caso contrário, removemos o item pelo ID
      return {
        ...state,
        items: state.items.filter((item) => item.cartItemId !== action.payload),
        loading: false,
      };

    case 'UPDATE_QUANTITY_SUCCESS':
      // Se recebemos o carrinho atualizado, usamos ele
      if (action.payload?.items) {
        return { ...state, items: action.payload.items, loading: false };
      }
      // Caso contrário, atualizamos o item específico
      return {
        ...state,
        items: state.items.map((item) =>
          item.cartItemId === action.payload.cartItemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        loading: false,
      };

    case 'CLEAR_CART_SUCCESS':
      return { ...state, items: [], loading: false };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };

    // No reducer, modifique o case 'SET_COUPON':
    case 'SET_COUPON':
      // Se estamos aplicando um cupom
      if (action.payload) {
        const couponData = action.payload;
        const discount = couponData.discountValue;
        const discountType = couponData.discountType;

        // Guardar os preços originais e aplicar o desconto em cada item
        const updatedItems = state.items.map((item) => {
          // Guardar o preço original se ainda não existir
          const originalPrice = item.originalPrice || item.price;
          let discountedPrice = originalPrice;

          // Calcular o preço com desconto
          if (discountType === 'percentage') {
            discountedPrice = originalPrice - originalPrice * (discount / 100);
          } else if (discountType === 'fixed_amount') {
            // Para desconto de valor fixo, distribuímos proporcionalmente entre os itens
            const totalItems = state.items.reduce(
              (sum, i) => sum + i.quantity,
              0
            );
            const itemDiscount = discount / totalItems;
            discountedPrice = Math.max(0, originalPrice - itemDiscount);
          }

          return {
            ...item,
            originalPrice, // Guardar o preço original
            price: discountedPrice, // Atualizar para o preço com desconto
            hasDiscount: true,
          };
        });

        return {
          ...state,
          appliedCoupon: action.payload,
          items: updatedItems,
        };
      }
      // Se estamos removendo um cupom
      else {
        // Restaurar os preços originais
        const restoredItems = state.items.map((item) => ({
          ...item,
          price: item.originalPrice || item.price, // Restaurar o preço original
          hasDiscount: false,
          originalPrice: undefined, // Opcional: remover propriedade de preço original
        }));

        return {
          ...state,
          appliedCoupon: null,
          items: restoredItems,
        };
      }

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    default:
      throw new Error(`Ação não suportada: ${action.type}`);
  }
}

// Provider do contexto do carrinho
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const hasLoadedCart = useRef(false); // Para evitar recarregar o carrinho se já foi carregado

  // Carregar o carrinho - agora depende também do estado de autenticação para recarregar
  // quando o usuário fizer login
  useEffect(() => {
    // Se o carrinho já foi carregado, não faça nada
    if (!isAuthenticated || hasLoadedCart.current) return;

    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        dispatch({ type: 'SET_COUPON', payload: JSON.parse(savedCoupon) });
      } catch (e) {
        localStorage.removeItem('appliedCoupon');
      }
    }

    const loadCart = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const cartData = await cartService.getCart();
        dispatch({ type: 'SET_CART', payload: cartData.items || [] });
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    // Sempre carrega o carrinho, seja do localStorage ou do servidor
    loadCart();
    hasLoadedCart.current = true; // Marca que o carrinho foi carregado
  }, [isAuthenticated]); // Agora depende de isAuthenticated para recarregar quando o status mudar

  // Monitorar quando usuário faz logout e resetar carrinho
  useEffect(() => {
    if (user === null) {
      // Usuário fez logout, resetar o carrinho imediatamente
      dispatch({ type: 'CLEAR_CART_SUCCESS' });
    }
  }, [user]);

  // Sincronizar o carrinho quando o usuário fizer login
  useEffect(() => {
    // Só sincronizar se estiver logado
    if (!isAuthenticated || !user) return;

    const syncCartWithServer = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Buscar os itens do localStorage diretamente
        const localCart = JSON.parse(
          localStorage.getItem('cart') || '{"items":[]}'
        );

        if (!localCart.items || localCart.items.length === 0) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // Função auxiliar para verificar se uma string é um ObjectId válido do MongoDB
        const isValidObjectId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

        // Adicionar itens um a um (abordagem mais confiável)
        let successCount = 0;

        for (const item of localCart.items) {
          try {
            // Garantir que o preço seja válido (prevenção de preços zerados)
            const price =
              parseFloat(item.price) || parseFloat(item.originalPrice) || 799.9;

            // Preparar o item sem variantId para evitar o erro de Cast to ObjectId
            const cleanItem = {
              sneakerId: item.sneakerId,
              size: item.size,
              color: item.color,
              quantity: item.quantity || 1,
              name: item.name,
              price: price, // Usar o preço garantidamente não-zero
              image: item.image || 'https://via.placeholder.com/150',
              brand:
                typeof item.brand === 'object' ? item.brand.name : item.brand,
              slug: item.slug,
            };

            // Adicionar variantId apenas se for um ObjectId válido
            if (isValidObjectId(item.sizeId)) {
              cleanItem.variantId = item.sizeId;
            } else if (isValidObjectId(item.variantId)) {
              cleanItem.variantId = item.variantId;
            }

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

        // Se pelo menos um item foi adicionado com sucesso
        if (successCount > 0) {
          // Limpar o localStorage
          localStorage.removeItem('cart');

          // Buscar o carrinho atualizado
          const updatedCart = await cartService.getCart();
          dispatch({ type: 'SET_CART', payload: updatedCart.items || [] });

          toast({
            title: 'Carrinho sincronizado',
            description: `${successCount} de ${localCart.items.length} itens foram transferidos para sua conta`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Falha na sincronização',
            description:
              'Não foi possível transferir seus itens para o servidor',
            variant: 'destructive',
          });
        }

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Erro na sincronização do carrinho:', error);
        toast({
          title: 'Erro na sincronização',
          description: 'Ocorreu um problema técnico',
          variant: 'destructive',
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    syncCartWithServer();
  }, [isAuthenticated, user]);

  // Adicionar item ao carrinho
  const addItem = async (item) => {
    if (!item || !item.sneakerId) {
      toast({
        title: 'Erro',
        description: 'Dados do produto incompletos',
        variant: 'destructive',
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Garantir que o preço seja válido (prevenção de preços zerados)
      const itemWithValidPrice = {
        ...item,
        price:
          parseFloat(item.price) || parseFloat(item.originalPrice) || 799.9,
      };

      const result = await cartService.addToCart(itemWithValidPrice);

      if (result.success) {
        // Atualizar o carrinho
        dispatch({
          type: 'ADD_ITEM_SUCCESS',
          payload: result.cart ? result : { item: itemWithValidPrice },
        });

        // Notificar o usuário
        toast({
          title: 'Produto adicionado',
          description: `${item.name || 'Produto'} foi adicionado ao carrinho`,
          variant: 'success',
        });
      } else {
        throw new Error(result.error || 'Erro ao adicionar produto');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Remover item do carrinho
  const removeItem = async (cartItemId) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await cartService.removeFromCart(cartItemId);

      if (result.success) {
        dispatch({ type: 'REMOVE_ITEM_SUCCESS', payload: result.cart });
        toast({ title: 'Item removido do carrinho' });
      } else {
        throw new Error(result.error || 'Erro ao remover item');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Atualizar quantidade de um item
  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await cartService.updateCartItemQuantity(
        cartItemId,
        quantity
      );

      if (result.success) {
        dispatch({ type: 'UPDATE_QUANTITY_SUCCESS', payload: result.cart });

        if (state.appliedCoupon) {
          // Pequeno timeout para garantir que a atualização da quantidade seja processada primeiro
          setTimeout(() => {
            // Reaplicar o mesmo cupom para recalcular os descontos
            dispatch({ type: 'SET_COUPON', payload: state.appliedCoupon });
          }, 10);
        }
      } else {
        throw new Error(result.error || 'Erro ao atualizar quantidade');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Limpar o carrinho
  const clearCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await cartService.clearCart();

      if (result.success) {
        dispatch({ type: 'CLEAR_CART_SUCCESS' });
        toast({
          title: 'Carrinho esvaziado',
          description: 'Todos os produtos foram removidos',
        });
      } else {
        throw new Error(result.error || 'Erro ao esvaziar carrinho');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Função para resetar o carrinho sem fazer requisição ao servidor
  const resetCart = () => {
    dispatch({ type: 'CLEAR_CART_SUCCESS' });
  };

  const applyCoupon = (couponData) => {
    dispatch({ type: 'SET_COUPON', payload: couponData });

    // Opcional: salvar no localStorage para persistir entre recarregamentos
    if (couponData) {
      localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  };

  // Funções para controlar a visibilidade do carrinho
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const setCartOpen = (isOpen) =>
    dispatch({ type: 'SET_CART_OPEN', payload: isOpen });

  // Calcular valores totais - melhor tratamento de erros com valores não numéricos
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

  const pixDiscount = parseFloat(subtotal) * 0.05;
  const couponDiscount = state.appliedCoupon
    ? state.appliedCoupon.discountAmount
    : 0;
  const totalWithDiscounts =
    parseFloat(subtotal) - pixDiscount - couponDiscount;

  // Valores e funções disponíveis no contexto
  const value = {
    items: state.items,
    isOpen: state.isOpen,
    loading: state.loading,
    error: state.error,
    cartCount,
    subtotal,
    addItem,
    pixDiscount,
    couponDiscount,
    totalWithDiscounts,
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
