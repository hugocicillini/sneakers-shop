import { useWishlist } from '@/contexts/WishlistContext';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '../ui/card';

const SneakersList = ({ sneakers }) => {
  const { isInWishlist, toggleWishlistItem, loading } = useWishlist();
  const [pendingActions, setPendingActions] = useState({});

  const navigate = useNavigate();

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleToggleFavorite = useCallback(
    async (sneakerId, event) => {
      event.stopPropagation();
      event.preventDefault();

      if (pendingActions[sneakerId] || loading) return;

      setPendingActions((prev) => ({ ...prev, [sneakerId]: true }));

      try {
        await toggleWishlistItem(sneakerId);
      } catch (error) {
        console.error('Erro ao atualizar wishlist:', error);
      } finally {
        setPendingActions((prev) => ({ ...prev, [sneakerId]: false }));
      }
    },
    [pendingActions, loading, toggleWishlistItem]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {sneakers.length > 0 &&
        sneakers.map((item) => (
          <Link
            key={item._id}
            to={`/sneaker/${
              item.slug
            }?color=${item.defaultColor.toLowerCase()}`}
            className="no-underline text-inherit"
          >
            <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg group relative">
              <div className="absolute top-0 right-0 z-20 flex flex-col">
                {item.isFeatured && (
                  <Badge
                    variant="default"
                    className={`bg-primary text-white rounded-none rounded-bl-md px-2`}
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" /> Destaque
                  </Badge>
                )}
              </div>

              <div className="relative w-full overflow-hidden bg-gray-50">
                <div className="w-full h-[280px] sm:h-[220px] transition-all duration-300">
                  <button
                    className={`absolute top-2 left-2 z-10 p-1.5 bg-white rounded-full shadow-sm transition-all duration-300 
                      ${
                        pendingActions[item._id]
                          ? 'opacity-70'
                          : 'hover:scale-110'
                      } 
                      ${
                        isInWishlist(item._id)
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleFavorite(item._id, e);
                    }}
                    disabled={pendingActions[item._id] || loading}
                    aria-label={
                      isInWishlist(item._id)
                        ? 'Remover dos favoritos'
                        : 'Adicionar aos favoritos'
                    }
                  >
                    <Heart
                      size={20}
                      fill={isInWishlist(item._id) ? 'currentColor' : 'none'}
                      className={
                        pendingActions[item._id] ? 'animate-pulse' : ''
                      }
                    />
                  </button>

                  <img
                    src={
                      item.coverImage?.url ||
                      (item.images && item.images.length > 0
                        ? item.images.find((img) => img.isPrimary)?.url ||
                          item.images[0].url
                        : item.image || '/placeholder-product.png')
                    }
                    alt={item.coverImage?.alt || item.name}
                    className="w-full h-full object-cover sm:object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105 bg-white"
                  />
                </div>
              </div>

              <CardContent className="flex flex-col flex-grow p-4">
                <CardTitle className="text-lg font-medium line-clamp-2 min-h-[3rem] mb-2">
                  {item.name}
                </CardTitle>

                {item.shortDescription && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {item.shortDescription}
                  </p>
                )}

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <span className="text-sm text-gray-500 mr-2">Preço</span>
                      {item.baseDiscount > 0 && (
                        <Badge
                          variant="destructive"
                          className="rounded-md text-xs px-1.5 py-0 h-5 min-w-0"
                        >
                          -{item.baseDiscount}%
                        </Badge>
                      )}
                    </div>
                    {item.basePrice && item.baseDiscount > 0 ? (
                      <div>
                        <span className="font-bold text-xl text-primary">
                          R$ {formatPrice(item.finalPrice)}
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          R$ {formatPrice(item.basePrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-xl text-primary">
                        R$ {formatPrice(item.basePrice || item.price || 0)}
                      </span>
                    )}
                  </div>

                  {item.rating > 0 && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm">{item.rating}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0">
                <Button variant="destructive" className="w-full">
                  <ShoppingCart size={18} />
                  Comprar
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
    </div>
  );
};

export default SneakersList;
