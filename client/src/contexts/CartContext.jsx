import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as cartService from '@/services/cart.service';
import { createContext, useContext, useEffect, useReducer } from 'react';

// Definição de contexto e estado inicial
const CartContext = createContext();

const initialState = {
  items: [],
  isOpen: false,
  loading: false,
  error: null,
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

  // Carregar o carrinho - agora depende também do estado de autenticação para recarregar
  // quando o usuário fizer login
  useEffect(() => {
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

  // Valores e funções disponíveis no contexto
  const value = {
    items: state.items,
    isOpen: state.isOpen,
    loading: state.loading,
    error: state.error,
    cartCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    resetCart, // Adicionada a nova função
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
