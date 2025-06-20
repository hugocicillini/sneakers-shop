import { toast } from '@/hooks/use-toast';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from '@/services/wishlist.service';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getWishlist();

      if (response.success) {
        setWishlistItems(response.wishlist || []);
      } else {
        console.error('Erro ao carregar wishlist:', response.message);
        setWishlistItems([]);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar sua lista de desejos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (sneakerId) => {
    return wishlistItems.some((item) => {
      if (item.sneaker) {
        return item.sneaker._id === sneakerId || item.sneaker === sneakerId;
      }
      return item._id === sneakerId || item === sneakerId;
    });
  };

  const addToWishlistItem = async (sneakerId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login para adicionar itens à wishlist',
        variant: 'default',
      });
      return false;
    }

    try {
      setWishlistItems((prev) => [...prev, { sneaker: { _id: sneakerId } }]);

      const response = await addToWishlist(sneakerId);

      if (!response.success) {
        throw new Error(response.message || 'Erro ao adicionar à wishlist');
      }

      toast({
        title: 'Adicionado com sucesso',
        description: 'Produto adicionado à sua lista de desejos',
        variant: 'default',
      });

      await loadWishlist();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar à wishlist:', error);
      setWishlistItems((prev) => prev.filter((id) => id !== sneakerId));
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar à wishlist',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeFromWishlistItem = async (sneakerId) => {
    if (!isAuthenticated) return false;

    try {
      setWishlistItems((prev) =>
        prev.filter((item) =>
          typeof item === 'object' ? item._id !== sneakerId : item !== sneakerId
        )
      );

      const response = await removeFromWishlist(sneakerId);

      if (!response.success) {
        throw new Error(response.message || 'Erro ao remover da wishlist');
      }

      toast({
        title: 'Removido com sucesso',
        description: 'Produto removido da sua lista de desejos',
        variant: 'default',
      });

      await loadWishlist();
      return true;
    } catch (error) {
      console.error('Erro ao remover da wishlist:', error);
      await loadWishlist();
      toast({
        title: 'Erro',
        description: 'Não foi possível remover da wishlist',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleWishlistItem = async (sneakerId) => {
    if (isInWishlist(sneakerId)) {
      return removeFromWishlistItem(sneakerId);
    } else {
      return addToWishlistItem(sneakerId);
    }
  };

  const value = {
    wishlistItems,
    isInWishlist,
    toggleWishlistItem,
    addToWishlistItem,
    removeFromWishlistItem,
    loading,
    wishlistCount: wishlistItems.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist deve ser usado dentro de um WishlistProvider');
  }
  return context;
};
