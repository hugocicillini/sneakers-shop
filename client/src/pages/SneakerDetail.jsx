import Reviews from '@/components/Reviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import { getSneakerBySlug } from '@/services/sneakers.service';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { Heart, ShoppingBagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import CarouselSneakers from '@/components/CarouselSneakers';

const SneakerDetail = () => {
  const { slug } = useParams();
  const location = useLocation();

  function getQueryParam(param) {
    const params = new URLSearchParams(location.search);
    return params.get(param);
  }

  const colorParam = getQueryParam('color');

  const [sneaker, setSneaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorImages, setColorImages] = useState([]);
  const [quantity, setQuantity] = useState(1);
  // Alterado para armazenar tanto preço original quanto com desconto
  const [selectedPrice, setSelectedPrice] = useState({
    originalPrice: 0,
    finalPrice: 0,
    discount: 0,
  });

  // Usando os contexts
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlistItem } = useWishlist();
  const { addItem, toggleCart } = useCart();

  useEffect(() => {
    const fetchSneaker = async () => {
      try {
        setLoading(true);
        const sneakerData = await getSneakerBySlug(slug, colorParam);
        setSneaker(sneakerData);

        // Usar a cor selecionada que vem do backend
        setSelectedColor(sneakerData.selectedColor);

        // Configurar o preço base do produto
        setSelectedPrice({
          originalPrice: sneakerData.basePrice,
          finalPrice: sneakerData.finalPrice,
          discount: sneakerData.baseDiscount,
        });

        // Configurar imagens da cor selecionada
        if (sneakerData.colorImages && sneakerData.colorImages.length > 0) {
          setColorImages(sneakerData.colorImages);

          // Selecionar a primeira imagem como imagem principal (ou a marcada como primária)
          const primaryImage = sneakerData.colorImages.find(
            (img) => img.isPrimary
          );
          setSelectedImage(
            primaryImage?.url || sneakerData.colorImages[0]?.url
          );
        } else if (sneakerData.coverImage) {
          setSelectedImage(sneakerData.coverImage.url);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar detalhes do tênis:', error);
        setLoading(false);
      }
    };

    fetchSneaker();
  }, [slug, colorParam]);

  const handleImageChange = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);

    // Atualizar o preço com base no tamanho selecionado
    if (sneaker && sneaker.sizesInStock) {
      const sizeData = sneaker.sizesInStock.find((item) => item.size === size);

      if (sizeData) {
        // Atualizar para o preço específico do tamanho
        setSelectedPrice({
          originalPrice: sizeData.price,
          finalPrice: sizeData.finalPrice,
          discount: sizeData.discount || 0,
        });
      } else {
        // Reverter para o preço base do produto
        setSelectedPrice({
          originalPrice: sneaker.basePrice,
          finalPrice: sneaker.finalPrice,
          discount: sneaker.baseDiscount,
        });
      }
    }
  };

  const handleColorSelect = (color) => {
    if (color !== selectedColor) {
      // Atualiza a URL e recarrega a página com a nova cor
      window.location.href = `/sneaker/${slug}?color=${encodeURIComponent(
        color.toLowerCase()
      )}`;
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(Math.max(1, value));
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast({
        title: 'Selecione o tamanho e a cor antes de adicionar ao carrinho.',
        variant: 'destructive',
      });
      return;
    }

    // Encontrar o tamanho selecionado na lista de tamanhos disponíveis
    const sizeData = sneaker.sizesInStock.find(
      (item) => item.size === parseInt(selectedSize)
    );

    if (!sizeData || sizeData.stock < quantity) {
      toast({
        title: 'Quantidade indisponível em estoque',
        description: `Máximo disponível: ${sizeData?.stock || 0} unidades.`,
        variant: 'destructive',
      });
      return;
    }

    // Preparar item para adicionar ao carrinho
    const cartItem = {
      sneakerId: sneaker._id,
      sizeId: sizeData.id,
      name: sneaker.name,
      price: sizeData.finalPrice,
      originalPrice: sizeData.price,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      image: selectedImage || sneaker.coverImage?.url,
      brand: sneaker.brand?.name || '',
      slug: sneaker.slug,
      variantId: sizeData.id,
    };

    console.log(cartItem);

    // Adicionar ao carrinho
    addItem(cartItem);

    toast({
      title: 'Produto adicionado ao carrinho',
      description: `${sneaker.name} - Tamanho ${selectedSize}, Cor ${selectedColor}`,
      variant: 'default',
    });

    // Abrir o carrinho para mostrar o que foi adicionado
    setTimeout(() => toggleCart(), 300);
  };

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

  // Adicione esta função para lidar com o scroll suave
  const scrollToReviews = (e) => {
    e.preventDefault();
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  if (loading) {
    return (
      <LayoutBase>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </LayoutBase>
    );
  }

  if (!sneaker) {
    return (
      <LayoutBase>
        <div className="flex items-center justify-center h-screen">
          <p className="text-xl text-gray-600">Tênis não encontrado.</p>
        </div>
      </LayoutBase>
    );
  }

  const colors = sneaker.availableColors?.map((ac) => ac.color) || [];

  // Determinar quais cores estão em estoque
  const colorsInStock = sneaker.colorsInStock || [];

  // Para os tamanhos, usar todos os tamanhos disponíveis do produto
  const allSizes = sneaker.availableSizes || [];

  // Função para formatar preço no padrão brasileiro (com vírgula)
  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <LayoutBase>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seção de imagens */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Miniaturas laterais */}
            <div className="flex md:flex-col gap-2 order-2 md:order-1">
              {colorImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => handleImageChange(image.url)}
                  className={`w-16 h-16 cursor-pointer border-2 rounded overflow-hidden ${
                    selectedImage === image.url
                      ? 'border-primary'
                      : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || sneaker.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Imagem principal */}
            <div className="flex-grow order-1 md:order-2">
              <img
                src={
                  selectedImage ||
                  (sneaker.coverImage ? sneaker.coverImage.url : '')
                }
                alt={sneaker.name}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>

          {/* Informações do produto */}
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{sneaker.name}</h1>
                <p className="text-gray-600 text-lg">
                  {sneaker.brand?.name || 'Marca não disponível'}
                </p>
              </div>
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
            </div>

            {/* Avaliação */}
            <div className="flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="relative">
                    <StarFilledIcon className={`h-5 w-5 text-gray-200`} />
                    {i < (sneaker.rating || 0) && (
                      <StarFilledIcon
                        className={`h-5 w-5 absolute top-0 left-0 text-yellow-400`}
                        style={{
                          clipPath:
                            i + 1 > sneaker.rating
                              ? `inset(0 ${
                                  100 - (sneaker.rating - i) * 100
                                }% 0 0)`
                              : 'none',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <span className="ml-2 text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">
                {(sneaker.rating || 0).toFixed(1)}
              </span>
              <a
                href="#reviews"
                onClick={scrollToReviews}
                className="ml-3 text-sm text-primary hover:underline"
              >
                Ver avaliações ({sneaker.reviewCount || 0})
              </a>
            </div>

            {/* Preço - Agora usando o preço do tamanho selecionado e formatação brasileira */}
            <div className="flex items-center space-x-3">
              {selectedPrice.discount > 0 ? (
                <>
                  <span className="text-3xl font-bold text-primary">
                    R$ {formatPrice(selectedPrice.finalPrice)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    R$ {formatPrice(selectedPrice.originalPrice)}
                  </span>
                  <span className="bg-red-500 text-white text-sm py-0.5 px-2 rounded-full">
                    -{selectedPrice.discount}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  R$ {formatPrice(selectedPrice.finalPrice)}
                </span>
              )}
            </div>

            {/* Seleção de cor */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Cor</h3>
              <div className="flex flex-wrap gap-2">
                {sneaker.availableColors.map((colorInfo) => {
                  const isAvailable = colorsInStock.some(
                    (c) => c.toLowerCase() === colorInfo.color.toLowerCase()
                  );

                  // Verificação case-insensitive para determinar a cor selecionada
                  const isSelected =
                    selectedColor?.toLowerCase() ===
                    colorInfo.color.toLowerCase();

                  return (
                    <button
                      key={colorInfo.color}
                      onClick={() =>
                        isAvailable && handleColorSelect(colorInfo.color)
                      }
                      disabled={!isAvailable}
                      className={`px-4 py-2 rounded-md border relative overflow-hidden ${
                        isSelected
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

            {/* Seleção de tamanho - mostrar todos os tamanhos disponíveis */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Tamanho</h3>
              {allSizes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((size) => {
                    // Verificar se o tamanho está disponível para a cor selecionada
                    const sizeData = sneaker.sizesInStock?.find(
                      (item) => item.size === size
                    );
                    const isAvailable = Boolean(sizeData?.isAvailable);

                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && handleSizeSelect(size)}
                        disabled={!isAvailable}
                        className={`w-12 h-12 rounded-md border relative overflow-hidden ${
                          selectedSize === size
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
              ) : (
                <p className="text-gray-500">Tamanhos não disponíveis</p>
              )}
            </div>

            {/* Quantidade */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Quantidade</h3>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-l-md rounded-r-none border-r-0"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <span className="text-lg font-semibold">-</span>
                </Button>
                <Input
                  type="number"
                  min="1"
                  disabled
                  value={quantity}
                  className="h-10 w-16 rounded-none text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-r-md rounded-l-none border-l-0"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <span className="text-lg font-semibold">+</span>
                </Button>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="relative mt-4">
              <Button
                onClick={handleAddToCart}
                className="w-full py-6 bg-primary hover:bg-primary/90 transition-colors"
                size="lg"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                <span>Adicionar ao carrinho</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="mt-12 border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">Descrição</h3>
          <p className="text-gray-700">{sneaker.description}</p>
          {sneaker.shortDescription && (
            <p className="text-gray-600 mt-2">{sneaker.shortDescription}</p>
          )}
        </div>

        {/* Seção para avaliações */}
        <div id="reviews" className="mt-12 border-t pt-6">
          <div className="flex justify-between items-center cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-md transition-colors duration-200">
            <h3 className="text-xl font-semibold">
              Avaliações ({sneaker.reviewCount || 0})
            </h3>
          </div>

          <div>
            <div className="transform transition-transform duration-500">
              <Reviews
                initialReviews={sneaker.reviews || []}
                sneakerId={sneaker._id}
                totalReviews={sneaker.reviewCount || 0}
                averageRating={sneaker.rating || 0}
              />
            </div>
          </div>
        </div>

        {/* Tênis relacionados */}
        {sneaker.relatedSneakers && sneaker.relatedSneakers.length > 0 && (
          <div className="mt-12 border-t pt-6">
            <CarouselSneakers
              sneakers={sneaker.relatedSneakers}
              title="Você também pode gostar"
            />
          </div>
        )}
      </div>
    </LayoutBase>
  );
};

export default SneakerDetail;
