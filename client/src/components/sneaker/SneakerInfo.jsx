import StarRating from './StarRating';

const SneakerInfo = ({ sneaker, selectedPrice, children }) => {
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

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="flex flex-col">
      {/* Nome e Marca do Tênis */}
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{sneaker.name}</h1>

        {/* Botão de Favoritar */}
        {children}
      </div>

      {/* Avaliação */}
      <a
        href="#reviews"
        onClick={scrollToReviews}
        className="text-sm text-primary hover:underline"
      >
        <StarRating
          rating={sneaker.rating}
          reviewCount={sneaker.reviewCount}
          isDetailPage={true}
        />
      </a>

      {/* Preço */}
      <div className="flex items-center space-x-3 mt-6">
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
    </div>
  );
};
export default SneakerInfo;
