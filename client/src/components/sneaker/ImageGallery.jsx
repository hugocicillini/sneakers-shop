import ImageZoom from './ImageZoom';

const ImageGallery = ({
  colorImages,
  sneaker,
  selectedImage,
  setSelectedImage,
}) => {
  const handleImageChange = (imageUrl) => {
    setSelectedImage(imageUrl);
  };
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Miniaturas laterais */}
      <div className="flex md:flex-col gap-2 order-2 md:order-1">
        {colorImages.map((image, index) => (
          <div
            key={index}
            onClick={() => handleImageChange(image.url)}
            className={`w-16 h-16 cursor-pointer border-2 rounded overflow-hidden ${
              selectedImage === image.url ? 'border-primary' : 'border-gray-200'
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
        <ImageZoom
          src={
            selectedImage || (sneaker.coverImage ? sneaker.coverImage.url : '')
          }
          alt={sneaker.name}
        />
      </div>
    </div>
  );
};
export default ImageGallery;
