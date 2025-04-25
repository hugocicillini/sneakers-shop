import { toast } from '@/hooks/use-toast';
import * as cartService from '@/services/cart.service';
import { createContext, useContext, useEffect, useReducer } from 'react';

// Definir o contexto
const CartContext = createContext();

// Estado inicial do carrinho
const initialState = {
  items: [],
  isOpen: false,
  loading: false,
  error: null,
};

// Reducer para gerenciar as ações do carrinho
function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      };

    case 'ADD_ITEM_SUCCESS': {
      // CORRIGIDO: Usar diretamente o carrinho retornado pelo serviço
      // O serviço já faz a lógica correta de soma das quantidades
      if (action.payload.cart?.items) {
        return { ...state, items: action.payload.cart.items, loading: false };
      }

      // Fallback (não deveria ser necessário)
      return {
        ...state,
        items: [...state.items, action.payload.item],
        loading: false,
      };
    }

    case 'REMOVE_ITEM_SUCCESS':
      if (action.payload?.items) {
        // Se a API retornar o carrinho inteiro
        return { ...state, items: action.payload.items, loading: false };
      }
      // Fallback para a lógica anterior
      return {
        ...state,
        items: state.items.filter((item) => item.cartItemId !== action.payload),
        loading: false,
      };

    case 'UPDATE_QUANTITY_SUCCESS':
      if (action.payload?.items) {
        // Se a API retornar o carrinho inteiro
        return { ...state, items: action.payload.items, loading: false };
      }
      // Fallback para a lógica anterior
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

  // Carregar dados do carrinho ao iniciar
  useEffect(() => {
    const fetchCart = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const cartData = await cartService.getCart();
        dispatch({ type: 'SET_CART', payload: cartData.items || [] });
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };
    fetchCart();
  }, []);

  // Nova função para sincronizar após o login
  const syncWithServer = async () => {
    if (state.items.length === 0) return;

    try {
      const result = await cartService.syncCart({
        items: state.items
      });
      
      if (result.success) {
        // Atualizar o carrinho com a versão do servidor
        dispatch({ type: 'SET_CART', payload: result.cart.items || [] });
        
        toast({
          title: 'Carrinho sincronizado',
          description: 'Seu carrinho foi sincronizado com sua conta',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar carrinho:', error);
    }
  };

  // Valores calculados - Correção para evitar erros com itens inválidos
  const cartCount = state.items.reduce((total, item) => {
    // Verifica se o item existe e tem a propriedade quantity
    return total + (item && typeof item.quantity === 'number' ? item.quantity : 0);
  }, 0);

  const subtotal = state.items.reduce(
    (total, item) => {
      // Verifica se o item existe e tem as propriedades necessárias
      if (item && typeof item.price === 'number' && typeof item.quantity === 'number') {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 
    0
  ).toFixed(2);

  // Função para adicionar item ao carrinho
  const addItem = async (item) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await cartService.addToCart(item);
      
      if (result.success) {
        if (result.cart) {
          // Se a API retornar o carrinho completo
          dispatch({ type: 'ADD_ITEM_SUCCESS', payload: result });
        } else if (result.cartItem) {
          // Se a API retornar apenas o item (para local storage)
          // Garantir que o item tenha o formato correto para o front-end
          const formattedItem = {
            ...item,
            ...result.cartItem,
            cartItemId: result.cartItem.cartItemId || `${result.cartItem.sneakerId}-${item.size}-${item.color}-${Date.now()}`
          };
          dispatch({ type: 'ADD_ITEM_SUCCESS', payload: { item: formattedItem } });
        } else {
          // Fallback para o item original
          dispatch({ type: 'ADD_ITEM_SUCCESS', payload: { item } });
        }
        
        toast({
          title: 'Produto adicionado ao carrinho',
          description: `${item.name} (${item.color}, ${item.size}) foi adicionado ao seu carrinho.`,
          variant: 'success',
        });
      } else {
        throw new Error(result.error || 'Erro ao adicionar produto ao carrinho');
      }
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      
      toast({
        title: 'Erro ao adicionar ao carrinho',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Função para remover item do carrinho
  const removeItem = async (cartItemId) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await cartService.removeFromCart(cartItemId);

      if (result.success) {
        dispatch({ type: 'REMOVE_ITEM_SUCCESS', payload: result.cart });

        toast({
          title: 'Produto removido do carrinho',
          variant: 'default',
        });
      } else {
        throw new Error(result.error || 'Erro ao remover produto do carrinho');
      }
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });

      toast({
        title: 'Erro ao remover do carrinho',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Função para atualizar quantidade
  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await cartService.updateCartItemQuantity(
        cartItemId,
        quantity
      );

      if (result.success) {
        dispatch({
          type: 'UPDATE_QUANTITY_SUCCESS',
          payload: result.cart,
        });
      } else {
        throw new Error(result.error || 'Erro ao atualizar quantidade');
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });

      toast({
        title: 'Erro ao atualizar quantidade',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Função para limpar o carrinho
  const clearCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await cartService.clearCart();

      if (result.success) {
        dispatch({ type: 'CLEAR_CART_SUCCESS' });

        toast({
          title: 'Carrinho esvaziado',
          description: 'Todos os produtos foram removidos do seu carrinho.',
          variant: 'default',
        });
      } else {
        throw new Error(result.error || 'Erro ao esvaziar carrinho');
      }
    } catch (error) {
      console.error('Erro ao esvaziar carrinho:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });

      toast({
        title: 'Erro ao esvaziar carrinho',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Função para alternar visibilidade do carrinho
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  // Função para abrir/fechar o carrinho explicitamente
  const setCartOpen = (isOpen) => {
    dispatch({ type: 'SET_CART_OPEN', payload: isOpen });
  };

  // Exportar o contexto e as funções
  const value = {
    ...state,
    cartCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    setCartOpen,
    syncWithServer, // Exportar a nova função
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook personalizado para acessar o contexto do carrinho
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
