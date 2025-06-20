import StarRating from '@/components/sneaker/StarRating';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddToCartDialog from '@/components/user/WishlistAddToCart';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import { Heart, HeartOff, ShoppingBag } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const {
    wishlistItems,
    toggleWishlistItem,
    loading: wishlistLoading,
  } = useWishlist();

  const [selectedSneaker, setSelectedSneaker] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatPrice = useCallback(
    (price) => price?.toFixed(2).replace('.', ',') || '0,00',
    []
  );

  const getStockStatus = useCallback((totalStock) => {
    if (totalStock > 10) return 'Em estoque';
    if (totalStock > 0) return `Apenas ${totalStock} restantes`;
    return 'Fora de estoque';
  }, []);

  const getValidColors = useCallback(
    (colors) =>
      (colors || []).filter(
        (colorInfo) => colorInfo.colorHex != null && colorInfo.colorHex !== ''
      ),
    []
  );

  const processedSneakers = useMemo(() => {
    return wishlistItems.map((item) => {
      const sneakerData = item.sneaker || item;
      const validColors = getValidColors(sneakerData.availableColors);

      return {
        ...sneakerData,
        id: sneakerData._id,
        hasDiscount: (sneakerData.baseDiscount || 0) > 0,
        formattedPrice: formatPrice(
          sneakerData.finalPrice || sneakerData.basePrice
        ),
        formattedOriginalPrice: formatPrice(sneakerData.basePrice),
        stockStatus: getStockStatus(sneakerData.totalStock),
        brandName: sneakerData.brand?.name || 'Sem marca',
        categoryName: sneakerData.category?.name || 'Sem categoria',
        filteredColors: validColors.slice(0, 4),
        hasMoreColors: validColors.length > 4,
        extraColorsCount: Math.max(0, validColors.length - 4),
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      };
    });
  }, [wishlistItems, formatPrice, getStockStatus, getValidColors]);

  const totalItems = useMemo(
    () => processedSneakers.length,
    [processedSneakers]
  );

  const handleRemoveFromWishlist = useCallback(
    async (id, name) => {
      try {
        const success = await toggleWishlistItem(id);

        if (success) {
          toast({
            title: 'Item removido! 💔',
            description: `${name || 'Produto'} foi removido dos seus favoritos`,
          });
        } else {
          throw new Error('Falha ao remover item');
        }
      } catch (error) {
        console.error('Erro ao remover item:', error);
        toast({
          title: 'Erro ao remover',
          description: 'Não foi possível remover o item. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
    [toggleWishlistItem]
  );

  const handleAddToCartDialog = useCallback((sneaker) => {
    setSelectedSneaker(sneaker);
    setDialogOpen(true);
  }, []);

  const handleDialogComplete = useCallback(() => {
    setSelectedSneaker(null);
    setDialogOpen(false);
  }, []);

  if (!isAuthenticated) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white rounded-lg shadow-sm p-8">
            <Heart className="w-16 h-16 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-center">
              Faça login para ver seus favoritos
            </h1>
            <p className="text-gray-500 text-center mb-6">
              Adicione produtos à sua lista de desejos e encontre-os facilmente
              mais tarde.
            </p>
            <Link to="/login?redirect=/wishlist">
              <Button size="lg" className="px-8">
                Fazer login
              </Button>
            </Link>
          </div>
        </div>
      </LayoutBase>
    );
  }

  if (wishlistLoading) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Meus Favoritos</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="p-4 flex flex-col space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </LayoutBase>
    );
  }

  if (totalItems === 0) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border p-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <HeartOff className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-900">
              Sua lista de favoritos está vazia
            </h1>
            <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
              Explore nossa coleção incrível e salve seus sneakers favoritos
              para encontrá-los facilmente mais tarde.
            </p>
            <div className="flex gap-3">
              <Link to="/">
                <Button size="lg" className="px-8 py-3 text-base">
                  Explorar produtos
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 text-base"
                >
                  Ir para início
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </LayoutBase>
    );
  }

  return (
    <LayoutBase>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Favoritos</h1>
            <p className="text-gray-600 mt-1">
              {totalItems}{' '}
              {totalItems === 1 ? 'produto salvo' : 'produtos salvos'}
            </p>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedSneakers.map((sneaker) => (
            <Card
              key={sneaker.id}
              className="overflow-hidden group hover:shadow-xl transition-all duration-300 border shadow-sm relative bg-white"
            >
              <div className="relative h-[280px] overflow-hidden bg-gray-50">
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                  {sneaker.hasDiscount && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded shadow-md">
                      -{sneaker.baseDiscount}% OFF
                    </span>
                  )}
                  {sneaker.totalStock <= 5 && sneaker.totalStock > 0 && (
                    <span className="bg-orange-100 text-orange-700 border border-orange-300 text-xs font-medium px-2 py-1 rounded">
                      Últimas {sneaker.totalStock}
                    </span>
                  )}
                </div>

                {/* Link para detalhes do produto */}
                <Link
                  to={`/sneaker/${
                    sneaker.slug
                  }?color=${sneaker.defaultColor?.toLowerCase()}`}
                  className="block h-full"
                >
                  <img
                    src={sneaker.coverImage?.url || '/placeholder-image.jpg'}
                    alt={sneaker.name}
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>

                {/* Botão de remover dos favoritos */}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() =>
                    handleRemoveFromWishlist(sneaker.id, sneaker.name)
                  }
                  className="absolute top-3 right-3 rounded-full bg-white/90 hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110"
                  aria-label={`Remover ${sneaker.name} dos favoritos`}
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </Button>

                {/* Botão de adicionar ao carrinho */}
                <Button
                  size="sm"
                  onClick={() => handleAddToCartDialog(sneaker)}
                  className="absolute bottom-3 right-3 shadow-lg bg-primary hover:bg-primary/90 text-white opacity-0 group-hover:opacity-100 transform transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                  aria-label={`Adicionar ${sneaker.name} ao carrinho`}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Carrinho
                </Button>
              </div>

              <div className="p-5">
                {/* Marca e data */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {sneaker.brandName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {sneaker.addedAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Nome do produto */}
                <Link
                  to={`/sneaker/${
                    sneaker.slug
                  }?color=${sneaker.defaultColor?.toLowerCase()}`}
                >
                  <h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors duration-300">
                    {sneaker.name}
                  </h3>
                </Link>

                {/* Avaliações */}
                <div className="mb-3">
                  <StarRating
                    rating={sneaker.rating}
                    reviewCount={sneaker.reviewCount}
                  />
                </div>

                {/* Cores disponíveis */}
                {sneaker.filteredColors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">
                      Cores disponíveis:
                    </p>
                    <div className="flex gap-1.5">
                      {sneaker.filteredColors.map((colorInfo, idx) => (
                        <div
                          key={idx}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                            colorInfo.color.toLowerCase() ===
                            sneaker.defaultColor?.toLowerCase()
                              ? 'ring-2 ring-primary ring-offset-1 border-white'
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: colorInfo.colorHex }}
                          title={colorInfo.colorName || colorInfo.color}
                          role="img"
                          aria-label={`Cor ${
                            colorInfo.colorName || colorInfo.color
                          }${
                            colorInfo.color.toLowerCase() ===
                            sneaker.defaultColor?.toLowerCase()
                              ? ' (cor padrão)'
                              : ''
                          }`}
                        />
                      ))}
                      {sneaker.hasMoreColors && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-600 font-medium">
                            +{sneaker.extraColorsCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preços e estoque */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-xl text-gray-900">
                      R$ {sneaker.formattedPrice}
                    </span>
                    {sneaker.hasDiscount && (
                      <span className="text-sm text-gray-500 line-through">
                        R$ {sneaker.formattedOriginalPrice}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      sneaker.totalStock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {sneaker.stockStatus}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de seleção de tamanho/quantidade */}
      {selectedSneaker && (
        <AddToCartDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sneaker={selectedSneaker}
          onComplete={handleDialogComplete}
        />
      )}
    </LayoutBase>
  );
};

export default Wishlist;
