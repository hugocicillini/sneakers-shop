import { StarFilledIcon } from '@radix-ui/react-icons';

const StarRating = ({ rating = 0, reviewCount = 0, isDetailPage = false }) => {
  // Definir tamanhos com base na propriedade isDetailPage
  const starSize = isDetailPage ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = isDetailPage ? 'text-sm' : 'text-xs';

  return (
    <div
      className="flex items-center"
      aria-label={`Avaliação ${rating} de 5 estrelas. Total de ${reviewCount} avaliações.`}
    >
      <div className="flex" role="presentation">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="relative">
            {/* Estrela cinza de fundo */}
            <StarFilledIcon className={`${starSize} text-gray-200`} />

            {/* Estrela dourada com clipping para representar frações */}
            {i < Math.ceil(rating) && (
              <div className="absolute top-0 left-0">
                <StarFilledIcon
                  className={`${starSize} text-yellow-400`}
                  style={{
                    clipPath:
                      i + 1 > rating
                        ? `inset(0 ${100 - (rating - i) * 100}% 0 0)`
                        : 'none',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <span className={`${textSize} text-gray-600 ml-1`}>
        {rating?.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
};

export default StarRating;
