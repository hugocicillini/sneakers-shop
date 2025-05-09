import StarRating from '@/components/sneaker/StarRating';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddToCartDialog from '@/components/user/WishlistAddToCart';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { Heart, HeartOff, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const {
    wishlistItems,
    toggleWishlistItem,
    loading: wishlistLoading,
  } = useWishlist();

  // Estados para controle da interface
  const [selectedSneaker, setSelectedSneaker] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Processar os itens da wishlist uma única vez usando useMemo
  const processedSneakers = useMemo(() => {
    return wishlistItems.map((item) => {
      // Se o item tiver estrutura aninhada (item.sneaker)
      const sneakerData = item.sneaker ? item.sneaker : item;

      // Normalizar os dados para uso na interface
      return {
        ...sneakerData,
        id: sneakerData._id,
        hasDiscount: (sneakerData.baseDiscount || 0) > 0,
        formattedPrice: sneakerData.finalPrice
          ? sneakerData.finalPrice.toFixed(2).replace('.', ',')
          : sneakerData.basePrice?.toFixed(2).replace('.', ','),
        formattedOriginalPrice: sneakerData.basePrice
          ?.toFixed(2)
          .replace('.', ','),
        stockStatus:
          sneakerData.totalStock > 10
            ? 'Em estoque'
            : sneakerData.totalStock > 0
            ? `Apenas ${sneakerData.totalStock} restantes`
            : 'Fora de estoque',
        brandName: sneakerData.brand?.name || 'Sem marca',
        categoryName: sneakerData.category?.name || 'Sem categoria',
        filteredColors: (sneakerData.availableColors || [])
          .filter(
            (colorInfo) =>
              colorInfo.colorHex != null && colorInfo.colorHex !== ''
          )
          .slice(0, 4),
        hasMoreColors:
          (sneakerData.availableColors || []).filter(
            (colorInfo) =>
              colorInfo.colorHex != null && colorInfo.colorHex !== ''
          ).length > 4,
        extraColorsCount:
          (sneakerData.availableColors || []).filter(
            (colorInfo) =>
              colorInfo.colorHex != null && colorInfo.colorHex !== ''
          ).length - 4,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      };
    });
  }, [wishlistItems]);

  // Memoizar contagem total para uso na UI
  const totalItems = useMemo(
    () => processedSneakers.length,
    [processedSneakers]
  );

  // Manipuladores de eventos
  const handleRemoveFromWishlist = async (id, name) => {
    // Mostrar loading state
    const toastId = toast({
      title: 'Removendo item...',
      description: `Removendo ${name || 'produto'} dos favoritos`,
    });

    const success = await toggleWishlistItem(id);

    if (success) {
      toast({
        id: toastId,
        title: 'Item removido',
        description: `${name || 'Produto'} foi removido dos seus favoritos`,
        variant: 'default',
      });
    } else {
      toast({
        id: toastId,
        title: 'Erro ao remover',
        description: 'Não foi possível remover o item. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCartDialog = (sneaker) => {
    setSelectedSneaker(sneaker);
    setDialogOpen(true);
  };

  const handleDialogComplete = () => {
    setSelectedSneaker(null);
    setDialogOpen(false);
  };

  // Renderização condicional: Não autenticado
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
            <Link to="/login">
              <Button size="lg" className="px-8">
                Fazer login
              </Button>
            </Link>
          </div>
        </div>
      </LayoutBase>
    );
  }

  // Renderização condicional: Carregando
  if (wishlistLoading) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Meus Favoritos</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="p-4 flex flex-col space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </LayoutBase>
    );
  }

  // Renderização condicional: Lista vazia
  if (totalItems === 0) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white rounded-lg shadow-sm p-8">
            <HeartOff className="w-16 h-16 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              Sua lista de favoritos está vazia
            </h1>
            <p className="text-gray-500 text-center mb-6">
              Explore nossa coleção e salve seus produtos favoritos para
              encontrá-los facilmente mais tarde.
            </p>
            <Link to="/">
              <Button size="lg" className="px-8">
                Explorar produtos
              </Button>
            </Link>
          </div>
        </div>
      </LayoutBase>
    );
  }

  // Renderização principal
  return (
    <LayoutBase>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meus Favoritos</h1>
        </div>

        {/* Renderização dos produtos em grid simples, sem agrupamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedSneakers.map((sneaker) => (
            <Card
              key={sneaker.id}
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 border shadow-sm relative"
            >
              <div className="relative h-[250px] overflow-hidden bg-gray-50">
                {/* Badge de desconto */}
                {sneaker.hasDiscount && (
                  <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                    -{sneaker.baseDiscount}% OFF
                  </span>
                )}

                {/* Link para detalhes do produto */}
                <Link
                  to={`/sneaker/${
                    sneaker.slug
                  }?color=${sneaker.defaultColor?.toLowerCase()}`}
                >
                  <img
                    src={sneaker.coverImage?.url || '/placeholder-image.jpg'}
                    alt={sneaker.name}
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                {/* Botão de remover dos favoritos */}
                <button
                  onClick={() =>
                    handleRemoveFromWishlist(sneaker.id, sneaker.name)
                  }
                  className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transform transition-all duration-300 hover:scale-110"
                  aria-label={`Remover ${sneaker.name} dos favoritos`}
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>

                {/* Botão de adicionar ao carrinho */}
                <Button
                  size="sm"
                  onClick={() => handleAddToCartDialog(sneaker)}
                  className="absolute bottom-3 right-3 rounded-full w-10 h-10 p-0 shadow-lg bg-primary hover:bg-primary/90 opacity-0 group-hover:opacity-100 transform transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                  aria-label={`Adicionar ${sneaker.name} ao carrinho`}
                >
                  <ShoppingBag className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-5">
                {/* Nome e marca */}
                <div className="mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {sneaker.brandName}
                  </p>
                  <Link
                    to={`/sneaker/${
                      sneaker.slug
                    }?color=${sneaker.defaultColor?.toLowerCase()}`}
                  >
                    <h3 className="font-semibold text-lg line-clamp-2 mt-1 group-hover:text-primary transition-colors duration-300">
                      {sneaker.name}
                    </h3>
                  </Link>
                </div>

                {/* Avaliações */}
                <StarRating rating={sneaker.rating} reviewCount={sneaker.reviewCount} />

                {/* Cores disponíveis */}
                {sneaker.filteredColors.length > 0 && (
                  <div className="my-2">
                    <p className="text-xs text-gray-500 mb-1">
                      Cores disponíveis:
                    </p>
                    <div className="flex gap-1">
                      {sneaker.filteredColors.map((colorInfo, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-full border ${
                            colorInfo.color.toLowerCase() ===
                            sneaker.defaultColor?.toLowerCase()
                              ? 'ring-1 ring-primary ring-offset-1'
                              : 'border-gray-300'
                          }`}
                          style={{
                            backgroundColor: colorInfo.colorHex,
                          }}
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
                        ></div>
                      ))}
                      {sneaker.hasMoreColors && (
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                          +{sneaker.extraColorsCount}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preços e estoque */}
                <div className="mt-4">
                  {sneaker.hasDiscount ? (
                    <div className="flex items-center">
                      <span className="font-bold text-lg text-primary">
                        R$ {sneaker.formattedPrice}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        R$ {sneaker.formattedOriginalPrice}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-primary">
                      R$ {sneaker.formattedPrice}
                    </span>
                  )}
                  <p className="text-xs mt-1 text-gray-500">
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
