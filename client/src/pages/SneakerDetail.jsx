import Reviews from '@/components/sneaker/Reviews';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import LayoutBase from '@/layout/LayoutBase';
import { getSneakerBySlug } from '@/services/sneakers.service';
import { LockIcon, ShoppingBagIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import CarouselSneakers from '@/components/sneaker/CarouselSneakers';
import ImageGallery from '@/components/sneaker/ImageGallery';
import Delivery from '@/components/sneaker/Shipping';
import SneakerInfo from '@/components/sneaker/SneakerInfo';
import ToggleFavorite from '@/components/sneaker/ToggleFavorite';

const SneakerDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [sneaker, setSneaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorImages, setColorImages] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState({
    originalPrice: 0,
    finalPrice: 0,
    discount: 0,
  });

  const { addItem, toggleCart } = useCart();

  const getQueryParam = useCallback(
    (param) => {
      const params = new URLSearchParams(location.search);
      return params.get(param);
    },
    [location.search]
  );

  const fetchSneakerData = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    setSelectedImage(null);
    setColorImages([]);

    try {
      const colorParam = getQueryParam('color');

      const sneakerData = await getSneakerBySlug(slug, colorParam);

      if (!sneakerData) {
        setError('Tênis não encontrado');
        return;
      }

      setSneaker(sneakerData);
      setSelectedColor(sneakerData.selectedColor);

      setSelectedPrice({
        originalPrice: sneakerData.basePrice,
        finalPrice: sneakerData.finalPrice,
        discount: sneakerData.baseDiscount,
      });

      if (sneakerData.colorImages && sneakerData.colorImages.length > 0) {
        setColorImages(sneakerData.colorImages);
        const primaryImage = sneakerData.colorImages.find(
          (img) => img.isPrimary
        );
        setSelectedImage(primaryImage?.url || sneakerData.colorImages[0]?.url);
      } else if (sneakerData.coverImage) {
        setColorImages([]);
        setSelectedImage(sneakerData.coverImage.url);
      }

      setSelectedSize(null);
    } catch (error) {
      console.error('❌ Erro ao buscar tênis:', error);
      setError('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  }, [slug, getQueryParam]);

  useEffect(() => {
    fetchSneakerData();
  }, [fetchSneakerData]);

  useEffect(() => {
    if (sneaker) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sneaker?.slug]);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);

    if (sneaker && sneaker.sizesInStock) {
      const sizeData = sneaker.sizesInStock.find((item) => item.size === size);

      if (sizeData) {
        setSelectedPrice({
          originalPrice: sizeData.price,
          finalPrice: sizeData.finalPrice,
          discount: sizeData.discount || 0,
        });
      } else {
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
      navigate(
        `/sneaker/${slug}?color=${encodeURIComponent(color.toLowerCase())}`
      );
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast({
        title: 'Selecione cor e tamanho',
        description: 'Por favor, escolha um tamanho e uma cor disponíveis.',
        variant: 'destructive',
      });
      return;
    }

    const sizeData = sneaker.sizesInStock.find(
      (item) => item.size === parseInt(selectedSize)
    );

    if (!sizeData || sizeData.stock < 1) {
      toast({
        title: 'Quantidade indisponível em estoque',
        description: `Máximo disponível: ${sizeData?.stock || 0} unidades.`,
        variant: 'destructive',
      });
      return;
    }

    const cartItem = {
      sneakerId: sneaker._id,
      sizeId: sizeData.id,
      name: sneaker.name,
      price: sizeData.finalPrice,
      originalPrice: sizeData.price,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      image: selectedImage || sneaker.coverImage?.url,
      brand: sneaker.brand?.name || '',
      slug: sneaker.slug,
      variantId: sizeData.id,
    };

    addItem(cartItem);

    toast({
      title: 'Produto adicionado ao carrinho',
      description: `${sneaker.name} - Tamanho ${selectedSize}, Cor ${selectedColor}`,
      variant: 'default',
    });

    setTimeout(() => toggleCart(), 300);
  };

  if (loading) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </LayoutBase>
    );
  }

  if (error || !sneaker) {
    return (
      <LayoutBase>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Produto não encontrado
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
            >
              Voltar à loja
            </button>
          </div>
        </div>
      </LayoutBase>
    );
  }

  const colorsInStock = sneaker.colorsInStock || [];
  const allSizes = sneaker.availableSizes || [];

  return (
    <LayoutBase>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <nav className="flex mb-4 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">
            Home
          </Link>
          <span className="mx-2">•</span>
          <span className="text-gray-800">{sneaker.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seção de imagens à esquerda */}
          <ImageGallery
            key={`${sneaker.slug}-${selectedColor}`}
            colorImages={colorImages}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            sneaker={sneaker}
          />

          {/* Informações do produto à direita */}
          <div className="flex flex-col space-y-6">
            {/* Área principal de informações */}
            <div>
              <SneakerInfo sneaker={sneaker} selectedPrice={selectedPrice}>
                <ToggleFavorite sneaker={sneaker} />
              </SneakerInfo>

              {/* Indicadores de urgência e status */}
              <div className="mt-3">
                {sneaker &&
                  sneaker.totalStock > 0 &&
                  sneaker.totalStock <= 5 && (
                    <p className="text-red-500 text-sm">
                      Apenas {sneaker.totalStock} unidades em estoque!
                    </p>
                  )}
              </div>
            </div>

            {/* Opções de customização */}
            <div className="space-y-5">
              {/* Seleção de cor */}
              <div>
                <h3 className="font-semibold mb-2">Cor</h3>
                <div className="flex flex-wrap gap-2">
                  {sneaker.availableColors.map((colorInfo) => {
                    const isAvailable = colorsInStock.some(
                      (c) => c.toLowerCase() === colorInfo.color.toLowerCase()
                    );
                    const isSelected =
                      selectedColor?.toLowerCase() ===
                      colorInfo.color.toLowerCase();

                    return (
                      <Button
                        variant="ghost"
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
                        <span className="relative z-10">
                          {colorInfo.colorName || colorInfo.color}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Seleção de tamanho */}
              <div>
                <h3 className="font-semibold mb-2">Tamanho</h3>
                {allSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => {
                      const sizeData = sneaker.sizesInStock?.find(
                        (item) => item.size === size
                      );
                      const isAvailable = Boolean(sizeData?.isAvailable);

                      return (
                        <Button
                          variant="ghost"
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
                          <span className="relative z-10">{size}</span>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Tamanhos não disponíveis</p>
                )}
              </div>
            </div>

            {/* Informações de entrega e garantias */}
            <Delivery />

            {/* Botão de ação */}
            <div className="relative mt-4">
              <Button
                onClick={handleAddToCart}
                className="w-full py-6 bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold">Adicionar ao carrinho</span>
              </Button>

              {/* Badge de segurança */}
              <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                <LockIcon size={12} className="mr-1" />
                <span>Pagamento 100% seguro</span>
              </div>
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
          <h3 className="text-xl font-semibold mb-4">
            Avaliações ({sneaker.reviewCount || 0})
          </h3>
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
