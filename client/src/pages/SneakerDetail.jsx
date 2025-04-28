import Reviews from '@/components/Reviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import { getSneakerBySlug } from '@/services/sneakers.service';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { Heart, ShoppingBagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import CarouselSneakers from '@/components/CarouselSneakers';

const SneakerDetail = () => {
  const { slug } = useParams();
  const [sneaker, setSneaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorImages, setColorImages] = useState([]); // Novo estado para as imagens da cor
  const [quantity, setQuantity] = useState(1);

  // Usando os contexts para favoritos e autenticação
  const { isAuthenticated } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { addItem, toggleCart } = useCart(); // Adicionando hook do carrinho
  
  useEffect(() => {
    const fetchSneaker = async () => {
      try {
        setLoading(true);

        // Obter dados reais da API
        const sneakerData = await getSneakerBySlug(slug);

        setSneaker(sneakerData);

        // Usar a cor padrão retornada pela API (cor com estoque disponível)
        if (sneakerData.defaultColor) {
          setSelectedColor(sneakerData.defaultColor);

          // Usar as imagens da cor padrão, se disponíveis
          if (
            sneakerData.currentColorImages &&
            sneakerData.currentColorImages.length > 0
          ) {
            setColorImages(sneakerData.currentColorImages);
            setSelectedImage(
              sneakerData.currentColorImages.find((img) => img.isPrimary)
                ?.url || sneakerData.currentColorImages[0]?.url
            );
          } else {
            // Fallback para as imagens padrão
            setSelectedImage(
              sneakerData.images.find((img) => img.isPrimary)?.url ||
                sneakerData.images[0]?.url
            );
          }
        } else {
          // Fallback para o comportamento anterior caso a API não retorne cor padrão
          setSelectedImage(
            sneakerData.images.find((img) => img.isPrimary)?.url ||
              sneakerData.images[0]?.url
          );
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar detalhes do tênis:', error);
        setLoading(false);
      }
    };

    fetchSneaker();
  }, [slug]);

  // Adicionar novo useEffect para carregar imagens específicas quando a cor mudar
  useEffect(() => {
    const loadColorImages = async () => {
      if (!sneaker || !selectedColor) return;

      try {
        // Verificar primeiro se as imagens já estão no objeto do sneaker
        const colorImageSet = sneaker.colorImages?.find(
          (item) => item.color.toLowerCase() === selectedColor.toLowerCase()
        );

        if (colorImageSet && colorImageSet.images.length > 0) {
          // Usar imagens já carregadas do objeto do tênis
          setColorImages(colorImageSet.images);
          setSelectedImage(
            colorImageSet.images.find((img) => img.isPrimary)?.url ||
              colorImageSet.images[0]?.url
          );
        } else {
          // Caso contrário, buscar do servidor
          const { getSneakerColorImages } = await import(
            '@/services/sneakers.service'
          );
          const response = await getSneakerColorImages(
            sneaker._id,
            selectedColor
          );

          if (response.colorImages && response.colorImages.length > 0) {
            setColorImages(response.colorImages);
            setSelectedImage(
              response.colorImages.find((img) => img.isPrimary)?.url ||
                response.colorImages[0]?.url
            );
          } else {
            // Voltar para imagens padrão se não houver específicas
            setColorImages([]);
            setSelectedImage(
              sneaker.images.find((img) => img.isPrimary)?.url ||
                sneaker.images[0]?.url
            );
          }
        }
      } catch (error) {
        console.error('Erro ao carregar imagens da cor:', error);
        // Em caso de erro, usar as imagens padrão
        setColorImages([]);
        setSelectedImage(
          sneaker.images.find((img) => img.isPrimary)?.url ||
            sneaker.images[0]?.url
        );
      }
    };

    loadColorImages();
  }, [selectedColor, sneaker]);

  const handleImageChange = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // As imagens serão carregadas pelo useEffect acima
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

    // Encontrar a variante correta para verificar estoque
    const selectedVariant = sneaker.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    );

    if (!selectedVariant || selectedVariant.stock < quantity) {
      toast({
        title: 'Quantidade indisponível em estoque',
        description: `Máximo disponível: ${selectedVariant?.stock || 0} unidades.`,
        variant: 'destructive',
      });
      return;
    }

    // Preparar item para adicionar ao carrinho
    const cartItem = {
      sneakerId: sneaker._id,
      variantId: selectedVariant._id, // Importante para identificar a variante específica
      name: sneaker.name,
      price: parseFloat(sneaker.finalPrice || sneaker.price),
      originalPrice: sneaker.price,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      image: (colorImages.length > 0 && colorImages.find(img => img.isPrimary)?.url) || 
             sneaker.images.find(img => img.isPrimary)?.url || 
             sneaker.images[0]?.url,
      brand: sneaker.brand,
      slug: sneaker.slug
    };

    // Adicionar ao carrinho usando o hook (funciona para usuários logados e não-logados)
    addItem(cartItem);
    
    // Abrir o carrinho para mostrar o que foi adicionado (opcional)
    setTimeout(() => toggleCart(), 300);
    
    // Se o usuário estiver autenticado, podemos fazer sincronização adicional com o backend
    if (isAuthenticated) {
      // Aqui poderia ser adicionada lógica para sincronizar com o carrinho do usuário no servidor
      // Por exemplo, chamar uma API para salvar o carrinho no perfil do usuário
    }
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
      await toggleFavorite(sneaker._id);
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

  return (
    <LayoutBase>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seção de imagens */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Miniaturas laterais */}
            <div className="flex md:flex-col gap-2 order-2 md:order-1">
              {/* Usar colorImages se disponíveis, caso contrário usar imagens padrão */}
              {(colorImages.length > 0 ? colorImages : sneaker.images).map(
                (image, index) => (
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
                )
              )}
            </div>

            {/* Imagem principal */}
            <div className="flex-grow order-1 md:order-2">
              <img
                src={selectedImage}
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
                <p className="text-gray-600 text-lg">{sneaker.brand}</p>
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
                  className={`w-6 h-6  ${
                    sneaker && isFavorite(sneaker._id)
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
                    {i < sneaker.rating && (
                      <StarFilledIcon
                        className={`h-5 w-5 absolute top-0 left-0 ${
                          i + 1 <= sneaker.rating
                            ? 'text-yellow-400'
                            : 'text-yellow-400'
                        }`}
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
                {sneaker.rating.toFixed(1)}
              </span>
              <a
                href="#reviews"
                onClick={scrollToReviews}
                className="ml-3 text-sm text-primary hover:underline"
              >
                Ver avaliações ({sneaker.reviewCount})
              </a>
            </div>

            {/* Preço */}
            <div className="flex items-center space-x-3">
              {sneaker.discount > 0 ? (
                <>
                  <span className="text-3xl font-bold text-primary">
                    R$ {sneaker.finalPrice}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    R$ {sneaker.price.toFixed(2)}
                  </span>
                  <span className="bg-red-500 text-white text-sm py-0.5 px-2 rounded-full">
                    -{sneaker.discount}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  R$ {sneaker.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Seleção de cor */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Cor</h3>
              <div className="flex flex-wrap gap-2">
                {sneaker.colors.map((color) => {
                  const isAvailable = sneaker.variants.some(
                    (variant) => variant.color === color && variant.stock > 0
                  );
                  return (
                    <button
                      key={color}
                      onClick={() => isAvailable && handleColorSelect(color)}
                      disabled={!isAvailable}
                      className={`px-4 py-2 rounded-md border relative overflow-hidden ${
                        selectedColor === color
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
                      <span className="relative z-10">{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seleção de tamanho */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Tamanho</h3>
              <div className="flex flex-wrap gap-2">
                {sneaker.sizes.map((size) => {
                  const isAvailable = sneaker.variants.some(
                    (variant) =>
                      variant.size === size &&
                      variant.stock > 0 &&
                      variant.color === selectedColor
                  );
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

            {/* Botão de compra/adicionar ao carrinho */}
            <div className="relative mt-4">
              <Button
                onClick={handleAddToCart}
                className="w-full py-6 bg-primary hover:bg-primary/90 transition-colors"
                size="lg"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                <span>Adicionar ao carrinho</span>
              </Button>

              {/* Botão de compra imediata */}
              <Button
                variant="secondary"
                className="w-full mt-2 py-6"
                size="lg"
              >
                Comprar agora
              </Button>
            </div>
          </div>
        </div>

        {/* Descrição - Movida para fora do grid, abaixo de todas as informações */}
        <div className="mt-12 border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">Descrição</h3>
          <p className="text-gray-700">{sneaker.description}</p>
        </div>

        {/* Seção para avaliações */}
        <div id="reviews" className="mt-12 border-t pt-6">
          <div className="flex justify-between items-center cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-md transition-colors duration-200">
            <h3 className="text-xl font-semibold">
              Avaliações ({sneaker.reviewCount || 0})
            </h3>
          </div>

          <div>
            <div className={`transform transition-transform duration-500 }`}>
              <Reviews
                initialReviews={sneaker.reviews || []}
                sneakerId={sneaker._id}
                totalReviews={sneaker.reviewCount || 0}
                averageRating={sneaker.rating || 0}
              />
            </div>
          </div>
        </div>

        {/* Tênis relacionados com nosso novo componente */}
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
