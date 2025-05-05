import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { Heart, HeartOff, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const { wishlistItems, toggleWishlistItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSneaker, setDialogSneaker] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Não precisa mais buscar sneakers, pois wishlistItems já traz tudo
  const sneakers = wishlistItems;
  const loading = false;

  const handleRemoveFromWishlist = async (id) => {
    await toggleWishlistItem(id);
    toast({
      title: 'Item removido',
      description: 'Item removido dos favoritos com sucesso',
    });
  };

  const handleAddToCartDialog = (sneaker) => {
    setDialogSneaker({
      ...sneaker,
      sizesInStock:
        sneaker.sizesInStock && sneaker.sizesInStock.length > 0
          ? sneaker.sizesInStock
          : (sneaker.availableSizes || []).flatMap((size) =>
              (sneaker.availableColors || []).map((colorObj) => ({
                size,
                color: colorObj.color,
                id: `${sneaker._id}-${colorObj.color}-${size}`,
                stock: sneaker.totalStock || 1,
                isAvailable: true,
              }))
            ),
      colorsInStock:
        sneaker.colorsInStock ||
        (sneaker.sizesInStock
          ? [
              ...new Set(
                sneaker.sizesInStock
                  .filter((v) => v.stock > 0)
                  .map((v) => v.color)
              ),
            ]
          : (sneaker.availableColors || []).map((c) => c.color)),
    });
    setSelectedColor('');
    setSelectedSize('');
    setQuantity(1);
    setDialogOpen(true);
  };

  const handleAddToCartConfirm = () => {
    if (!selectedColor) {
      toast({
        title: 'Selecione uma cor',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedSize) {
      toast({
        title: 'Selecione um tamanho',
        variant: 'destructive',
      });
      return;
    }
    const sizeData = dialogSneaker.sizesInStock?.find(
      (item) =>
        item.size === parseInt(selectedSize) && item.color === selectedColor
    );
    if (!sizeData || sizeData.stock < quantity) {
      toast({
        title: 'Tamanho ou estoque indisponível',
        variant: 'destructive',
      });
      return;
    }
    addItem({
      sneakerId: dialogSneaker._id,
      sizeId: sizeData.id,
      name: dialogSneaker.name,
      price: dialogSneaker.finalPrice,
      originalPrice: dialogSneaker.basePrice,
      size: sizeData.size,
      color: selectedColor,
      quantity: quantity,
      image: dialogSneaker.coverImage?.url,
      brand: dialogSneaker.brand?.name || '',
      slug: dialogSneaker.slug,
    });
    toast({
      title: 'Item adicionado ao carrinho',
      description: `${dialogSneaker.name} adicionado ao carrinho`,
    });
    setDialogOpen(false);
  };

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

  if (loading) {
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

  if (wishlistItems.length === 0) {
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

  return (
    <LayoutBase>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meus Favoritos</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sneakers.map((sneaker) => (
            <Card
              key={sneaker.slug}
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 border shadow-sm relative"
            >
              {/* Badge para produtos com desconto - agora posicionado apenas sobre a imagem */}
              <div className="relative h-[250px] overflow-hidden bg-gray-50 group">
                {sneaker.baseDiscount > 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                    -{sneaker.baseDiscount}% OFF
                  </span>
                )}
                <Link
                  to={`/sneaker/${
                    sneaker.slug
                  }?color=${sneaker.defaultColor.toLowerCase()}`}
                >
                  <img
                    src={sneaker.coverImage?.url || '/placeholder-image.jpg'}
                    alt={sneaker.name}
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <button
                  onClick={() => handleRemoveFromWishlist(sneaker._id)}
                  className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transform transition-all duration-300 hover:scale-110"
                  aria-label="Remover dos favoritos"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
                {/* Botão de adicionar ao carrinho abre dialog */}
                <Button
                  size="sm"
                  onClick={() => handleAddToCartDialog(sneaker)}
                  className="absolute bottom-3 right-3 rounded-full w-10 h-10 p-0 shadow-lg bg-primary hover:bg-primary/90 opacity-0 group-hover:opacity-100 transform transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                >
                  <ShoppingBag className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-5">
                <div className="mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {sneaker.brand.name}
                  </p>
                  <Link to={`/sneaker/${sneaker.slug}?color=${sneaker.defaultColor.toLowerCase()}`}>
                    <h3 className="font-semibold text-lg line-clamp-2 mt-1 group-hover:text-primary transition-colors duration-300">
                      {sneaker.name}
                    </h3>
                  </Link>
                </div>

                {/* Estrelas de rating corretas */}
                {typeof sneaker.rating === 'number' && (
                  <div className="flex items-center mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="relative">
                          <StarFilledIcon className="h-5 w-5 text-gray-200" />
                          {i + 1 <= Math.floor(sneaker.rating || 0) && (
                            <StarFilledIcon className="h-5 w-5 absolute top-0 left-0 text-yellow-400" />
                          )}
                          {i < (sneaker.rating || 0) &&
                            i + 1 > Math.floor(sneaker.rating || 0) && (
                              <StarFilledIcon
                                className="h-5 w-5 absolute top-0 left-0 text-yellow-400"
                                style={{
                                  clipPath: `inset(0 ${
                                    100 - (sneaker.rating - i) * 100
                                  }% 0 0)`,
                                }}
                              />
                            )}
                        </div>
                      ))}
                    </div>
                    <span className="ml-2 text-xs text-gray-600">
                      {sneaker.rating > 0
                        ? `(${sneaker.rating.toFixed(1)})`
                        : '(0)'}
                      {sneaker.reviewCount > 0
                        ? ` • ${sneaker.reviewCount} review${
                            sneaker.reviewCount > 1 ? 's' : ''
                          }`
                        : ''}
                    </span>
                  </div>
                )}

                {sneaker.availableColors &&
                  sneaker.availableColors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Cores disponíveis:
                      </p>
                      <div className="flex gap-1">
                        {sneaker.availableColors
                          .slice(0, 4)
                          .filter(
                            (colorInfo) =>
                              colorInfo.colorHex != null &&
                              colorInfo.colorHex !== ''
                          )
                          .map((colorInfo, idx) => (
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
                            ></div>
                          ))}
                        {sneaker.availableColors.filter(
                          (colorInfo) =>
                            colorInfo.colorHex != null &&
                            colorInfo.colorHex !== ''
                        ).length > 4 && (
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                            +
                            {sneaker.availableColors.filter(
                              (colorInfo) =>
                                colorInfo.colorHex != null &&
                                colorInfo.colorHex !== ''
                            ).length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                <div className="mt-4">
                  {sneaker.baseDiscount > 0 ? (
                    <div className="flex items-center">
                      <span className="font-bold text-lg text-primary">
                        R$ {sneaker.finalPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        R$ {sneaker.basePrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-primary">
                      R$ {sneaker.basePrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <p className="text-xs mt-1 text-gray-500">
                    {sneaker.totalStock > 10
                      ? 'Em estoque'
                      : sneaker.totalStock > 0
                      ? `Apenas ${sneaker.totalStock} restantes`
                      : 'Fora de estoque'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {/* Dialog de seleção de tamanho/quantidade */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolha a cor, tamanho e quantidade</DialogTitle>
          </DialogHeader>
          {dialogSneaker && (
            <div>
              {/* Seleção de cor */}
              <div className="mb-4">
                <span className="font-medium">Cor:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(dialogSneaker.availableColors || []).map((colorInfo) => {
                    const isAvailable = dialogSneaker.colorsInStock?.some(
                      (c) => c.toLowerCase() === colorInfo.color.toLowerCase()
                    );
                    return (
                      <button
                        key={colorInfo.color}
                        type="button"
                        onClick={() =>
                          isAvailable && setSelectedColor(colorInfo.color)
                        }
                        disabled={!isAvailable}
                        className={`px-4 py-2 rounded-md border relative overflow-hidden ${
                          selectedColor === colorInfo.color
                            ? 'border-primary bg-primary/10 text-primary'
                            : isAvailable
                            ? 'border-gray-300 hover:border-gray-400'
                            : 'border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {!isAvailable && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                'linear-gradient(to left bottom, transparent calc(50% - 1px), #e5e7eb, transparent calc(50% + 1px))',
                            }}
                          />
                        )}
                        <span className="relative z-10">
                          {colorInfo.colorName || colorInfo.color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Seleção de tamanho */}
              <div className="mb-4">
                <span className="font-medium">Tamanhos disponíveis:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(dialogSneaker.availableSizes || []).map((size) => {
                    // Verifica se existe uma variante disponível com a cor e tamanho selecionados
                    const sizeData = dialogSneaker.sizesInStock?.find(
                      (item) =>
                        item.size === size &&
                        item.color === selectedColor &&
                        item.isAvailable !== false &&
                        item.stock > 0
                    );
                    const isAvailable = Boolean(sizeData);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          isAvailable && setSelectedSize(String(size))
                        }
                        disabled={!isAvailable || !selectedColor}
                        className={`w-12 h-12 rounded-md border relative overflow-hidden ${
                          selectedSize === String(size)
                            ? 'border-primary bg-primary/10 text-primary'
                            : isAvailable
                            ? 'border-gray-300 hover:border-gray-400'
                            : 'border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {!isAvailable && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                'linear-gradient(to left bottom, transparent calc(50% - 1px), #e5e7eb, transparent calc(50% + 1px))',
                            }}
                          />
                        )}
                        <span className="relative z-10">{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Quantidade */}
              <div className="mb-4">
                <span className="font-medium">Quantidade:</span>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleAddToCartConfirm}
              disabled={!selectedColor || !selectedSize}
              className="w-full"
            >
              Adicionar ao carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutBase>
  );
};

export default Wishlist;
