import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import ImageZoom from './ImageZoom';

const ImageGallery = ({
  colorImages,
  sneaker,
  selectedImage,
  setSelectedImage,
}) => {
  const [visibleStart, setVisibleStart] = useState(0);
  const visibleCount = 7;

  useEffect(() => {
    setVisibleStart(0);
  }, [colorImages]);

  useEffect(() => {
    if (colorImages && colorImages.length > 0) {
      const currentImageExists = colorImages.some(
        (img) => img.url === selectedImage
      );

      if (!selectedImage || !currentImageExists) {
        const primaryImage = colorImages.find((img) => img.isPrimary);
        const newSelectedImage = primaryImage?.url || colorImages[0]?.url;
        setSelectedImage(newSelectedImage);
      }
    } else if (
      sneaker?.coverImage &&
      (!selectedImage || !colorImages?.length)
    ) {
      setSelectedImage(sneaker.coverImage.url);
    }
  }, [colorImages, selectedImage, setSelectedImage, sneaker]);

  const handleImageChange = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const scrollUp = () => {
    setVisibleStart(Math.max(0, visibleStart - 1));
  };

  const scrollDown = () => {
    setVisibleStart(
      Math.min(colorImages.length - visibleCount, visibleStart + 1)
    );
  };

  if (!colorImages || colorImages.length === 0) {
    return (
      <div className="flex-grow">
        <ImageZoom
          src={sneaker?.coverImage?.url || '/placeholder-image.jpg'}
          alt={sneaker?.name || 'Produto'}
        />
      </div>
    );
  }

  const visibleImages = colorImages.slice(
    visibleStart,
    visibleStart + visibleCount
  );
  const canScrollUp = visibleStart > 0;
  const canScrollDown = visibleStart + visibleCount < colorImages.length;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Carousel vertical de miniaturas */}
      <div className="flex md:flex-col gap-2 order-2 md:order-1">
        {/* Versão desktop - carousel vertical */}
        <div className="hidden md:flex md:flex-col md:items-center">
          {/* Botão para subir */}
          {colorImages.length > visibleCount && (
            <button
              onClick={scrollUp}
              disabled={!canScrollUp}
              className={`p-2 rounded-full transition-all mb-2 ${
                !canScrollUp
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronUp size={16} />
            </button>
          )}

          {/* Miniaturas visíveis */}
          <div className="flex flex-col gap-2">
            {visibleImages.map((image, index) => (
              <div
                key={`desktop-${image.url}-${visibleStart + index}`}
                onClick={() => handleImageChange(image.url)}
                className={`w-16 h-16 cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedImage === image.url
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt || sneaker.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Botão para descer */}
          {colorImages.length > visibleCount && (
            <button
              onClick={scrollDown}
              disabled={!canScrollDown}
              className={`p-2 rounded-full transition-all mt-2 ${
                !canScrollDown
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>

        {/* Versão mobile - horizontal */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
          {colorImages.map((image, index) => (
            <div
              key={`mobile-${image.url}-${index}`}
              onClick={() => handleImageChange(image.url)}
              className={`min-w-16 w-16 h-16 cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                selectedImage === image.url
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt || sneaker.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Imagem principal */}
      <div className="flex-grow order-1 md:order-2">
        <ImageZoom
          key={selectedImage}
          src={
            selectedImage ||
            sneaker?.coverImage?.url ||
            '/placeholder-image.jpg'
          }
          alt={sneaker?.name || 'Produto'}
        />
      </div>
    </div>
  );
};

export default ImageGallery;
