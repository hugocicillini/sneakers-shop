import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Heart } from 'lucide-react';

const ToggleFavorite = ({ sneaker }) => {
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlistItem } = useWishlist();

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login para adicionar itens aos favoritos',
        variant: 'default',
      });
      return;
    }

    if (sneaker) {
      await toggleWishlistItem(sneaker._id);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className="p-2 border rounded-full hover:bg-gray-100 transition-colors"
      title={
        isAuthenticated
          ? 'Adicionar/Remover dos favoritos'
          : 'Faça login para adicionar aos favoritos'
      }
    >
      <Heart
        className={`w-6 h-6 ${
          sneaker && isInWishlist(sneaker._id)
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400'
        }`}
      />
    </button>
  );
};
export default ToggleFavorite;
