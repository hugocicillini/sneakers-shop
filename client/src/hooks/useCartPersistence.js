import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function useCartPersistence() {
  const { user, isAuthenticated } = useAuth();
  const { syncWithServer } = useCart();
  const hasSyncedRef = useRef(false);

  // Sincronizar carrinho após login - apenas uma vez
  useEffect(() => {
    if (isAuthenticated && user && !hasSyncedRef.current) {
      // Marcar que já sincronizou para evitar múltiplas sincronizações
      hasSyncedRef.current = true;
      
      // Pequeno atraso para garantir que o token esteja disponível e processado
      const timerId = setTimeout(() => {
        syncWithServer();
      }, 500);
      
      return () => clearTimeout(timerId);
    }
    
    // Resetar o flag se o usuário deslogar
    if (!isAuthenticated && !user) {
      hasSyncedRef.current = false;
    }
  }, [isAuthenticated, user, syncWithServer]);

  return null;
}
