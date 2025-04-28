import { toast } from '@/hooks/use-toast';
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
} from '@/services/wishlist.service';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Carregar favoritos quando o componente montar ou usuário autenticar
  const loadFavorites = async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getUserFavorites();
      // A API pode retornar um array de documentos, então pegamos o primeiro se for um array
      const userFavorites =
        Array.isArray(response) && response.length > 0 ? response[0] : response;

      // Extraímos a lista de IDs dos sneakers favoritos para ter um formato consistente
      const favoriteSneakers = userFavorites?.sneakers || [];
      setFavorites(favoriteSneakers);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar favoritos no início e quando o status de autenticação mudar
  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated]);

  // Verificar se um produto está nos favoritos
  const isFavorite = (sneakerId) => {
    return favorites.includes(sneakerId);
  };

  // Adicionar aos favoritos
  const addToFavorites = async (sneakerId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login para adicionar itens aos favoritos',
        variant: 'default',
      });
      return false;
    }

    try {
      // Atualiza o estado local imediatamente para feedback instantâneo
      setFavorites((prev) => [...prev, sneakerId]);

      // Chama a API em segundo plano
      await addFavorite(sneakerId);

      // Recarrega os favoritos para garantir sincronização
      await loadFavorites();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
      // Reverte a mudança local em caso de erro
      setFavorites((prev) => prev.filter((id) => id !== sneakerId));
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar aos favoritos',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Remover dos favoritos
  const removeFromFavorites = async (sneakerId) => {
    if (!isAuthenticated) return false;

    try {
      // Atualiza o estado local imediatamente para feedback instantâneo
      setFavorites((prev) => prev.filter((id) => id !== sneakerId));

      // Chama a API em segundo plano
      await removeFavorite(sneakerId);

      // Recarrega os favoritos para garantir sincronização
      await loadFavorites();
      return true;
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
      // Reverte a mudança local em caso de erro
      setFavorites((prev) => [...prev, sneakerId]);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover dos favoritos',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Alternar favorito (adicionar se não existir, remover se existir)
  const toggleFavorite = async (sneakerId) => {
    if (isFavorite(sneakerId)) {
      return removeFromFavorites(sneakerId);
    } else {
      return addToFavorites(sneakerId);
    }
  };

  const value = {
    favorites, // Lista de IDs dos produtos favoritos
    isFavorite, // Função para verificar se um produto está nos favoritos
    toggleFavorite, // Função para alternar o status de favorito
    addToFavorites, // Função para adicionar aos favoritos
    removeFromFavorites, // Função para remover dos favoritos
    loading, // Estado de carregamento
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error(
      'useFavorites deve ser usado dentro de um FavoritesProvider'
    );
  }
  return context;
};
