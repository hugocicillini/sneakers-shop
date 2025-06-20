import { cn } from '@/lib/utils';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';

const StarRating = ({
  rating = 0,
  reviewCount = 0,
  isDetailPage = false,
  size = 'default',
  showCount = true,
  showRating = true,
  interactive = false,
  onRatingChange = null,
  className = '',
  maxRating = 5,
}) => {
  const sizeConfig = useMemo(
    () => ({
      xs: {
        star: 'h-3 w-3',
        text: 'text-xs',
        gap: 'gap-0.5',
      },
      sm: {
        star: 'h-4 w-4',
        text: 'text-xs',
        gap: 'gap-1',
      },
      default: {
        star: isDetailPage ? 'h-5 w-5' : 'h-4 w-4',
        text: isDetailPage ? 'text-sm' : 'text-xs',
        gap: 'gap-1',
      },
      lg: {
        star: 'h-6 w-6',
        text: 'text-sm',
        gap: 'gap-1.5',
      },
      xl: {
        star: 'h-8 w-8',
        text: 'text-base',
        gap: 'gap-2',
      },
    }),
    [isDetailPage]
  );

  const normalizedRating = useMemo(() => {
    const num = Number(rating);
    if (isNaN(num) || num < 0) return 0;
    if (num > maxRating) return maxRating;
    return Math.round(num * 2) / 2;
  }, [rating, maxRating]);

  const normalizedReviewCount = useMemo(() => {
    const num = Number(reviewCount);
    return isNaN(num) || num < 0 ? 0 : num;
  }, [reviewCount]);

  const formattedReviewCount = useMemo(() => {
    if (normalizedReviewCount === 0) return '0';
    if (normalizedReviewCount < 1000) return normalizedReviewCount.toString();
    if (normalizedReviewCount < 1000000) {
      return `${(normalizedReviewCount / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return `${(normalizedReviewCount / 1000000).toFixed(1).replace('.0', '')}M`;
  }, [normalizedReviewCount]);

  const currentSize = sizeConfig[size] || sizeConfig.default;

  const handleStarClick = (starIndex) => {
    if (!interactive || !onRatingChange) return;
    const newRating = starIndex + 1;
    onRatingChange(newRating);
  };

  const renderStars = () => {
    return Array.from({ length: maxRating }, (_, i) => {
      const starValue = i + 1;
      const fillPercentage = Math.min(Math.max(normalizedRating - i, 0), 1);
      const isFilled = fillPercentage > 0;
      const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 1;

      return (
        <div
          key={i}
          className={cn(
            'relative',
            interactive && 'cursor-pointer transition-transform hover:scale-110'
          )}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          role={interactive ? 'button' : 'presentation'}
          aria-label={
            interactive
              ? `Dar ${starValue} estrela${starValue > 1 ? 's' : ''}`
              : undefined
          }
          tabIndex={interactive ? 0 : -1}
        >
          {/* Estrela de fundo (cinza) */}
          <StarFilledIcon
            className={cn(
              currentSize.star,
              'text-gray-200 transition-colors',
              interactive && 'hover:text-gray-300'
            )}
          />

          {/* Estrela preenchida (dourada) */}
          {isFilled && (
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={{
                width: isPartiallyFilled ? `${fillPercentage * 100}%` : '100%',
              }}
            >
              <StarFilledIcon
                className={cn(
                  currentSize.star,
                  'text-yellow-400 transition-colors',
                  interactive && 'hover:text-yellow-500'
                )}
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className={cn(
        'flex items-center',
        currentSize.gap,
        interactive && 'select-none',
        className
      )}
      role={interactive ? 'radiogroup' : 'img'}
    >
      {/* Estrelas */}
      <div className="flex" role="presentation">
        {renderStars()}
      </div>

      {/* Texto de rating e contagem */}
      {(showRating || showCount) && (
        <div className={cn('flex items-center ml-2', currentSize.text)}>
          {showRating && (
            <span className="text-gray-700 font-medium">
              {normalizedRating.toFixed(1)}
            </span>
          )}

          {showRating && showCount && (
            <span className="text-gray-400 mx-1">•</span>
          )}

          {showCount && (
            <span className="text-gray-500">({formattedReviewCount})</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;
