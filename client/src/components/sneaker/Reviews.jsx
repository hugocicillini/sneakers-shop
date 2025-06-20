import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { getSneakerReviews } from '@/services/reviews.service';
import { StarFilledIcon } from '@radix-ui/react-icons';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';

const ReviewSkeleton = memo(() => (
  <div className="space-y-6">
    {Array(3)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="border-b pb-4">
          <div className="flex justify-between mb-3">
            <div className="flex gap-1">
              {Array(5)
                .fill(0)
                .map((_, j) => (
                  <Skeleton key={j} className="h-4 w-4" />
                ))}
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center mb-3">
            <Skeleton className="h-4 w-20 mr-2" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
  </div>
));

const ReviewItem = memo(({ review }) => {
  const formattedDate = useMemo(() => {
    if (!review.date) return 'Data não informada';

    try {
      return new Date(review.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return 'Data inválida';
    }
  }, [review.date]);

  const isRecentReview = useMemo(() => {
    if (!review.date) return false;
    const reviewDate = new Date(review.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return reviewDate > thirtyDaysAgo;
  }, [review.date]);

  return (
    <div className="border-b border-gray-100 pb-6 last:border-b-0">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <StarFilledIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
          </div>
          {isRecentReview && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-700"
            >
              Recente
            </Badge>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          {formattedDate}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex items-center gap-2">
          <div className="font-medium text-gray-900">
            {review.user?.name || 'Cliente Anônimo'}
          </div>
          {review.isVerified && (
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Compra verificada
            </div>
          )}
        </div>
      </div>

      {review.comment && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            "{review.comment}"
          </p>
        </div>
      )}

      {/* Informações extras se disponíveis */}
      {(review.size || review.color) && (
        <div className="flex gap-2 mt-3">
          {review.size && (
            <Badge variant="outline" className="text-xs">
              Tamanho {review.size}
            </Badge>
          )}
          {review.color && (
            <Badge variant="outline" className="text-xs">
              Cor {review.color}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

const Reviews = ({
  initialReviews = [],
  sneakerId,
  totalReviews = 0,
  averageRating = 0,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('recent');
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observerRef = useRef(null);

  const itemsPerPage = 10;

  const hasMoreReviews = useMemo(
    () => totalReviews > initialReviews.length,
    [totalReviews, initialReviews.length]
  );

  const getRatingPercentage = useCallback(
    (star) => {
      if (!initialReviews.length) return 0;
      const count = initialReviews.filter(
        (review) => Number(review.rating) === star
      ).length;
      return Math.round((count / initialReviews.length) * 100);
    },
    [initialReviews]
  );

  const loadMoreReviews = useCallback(
    async (pageNum, isNewSort = false) => {
      if (loading) return;

      try {
        setLoading(true);
        setError(null);

        const response = await getSneakerReviews(sneakerId, {
          page: pageNum,
          limit: itemsPerPage,
          sort: sortOrder,
        });

        const newReviews = response.data || [];
        const hasMoreData = newReviews.length === itemsPerPage;

        setHasMore(hasMoreData);
        setDisplayedReviews((prev) =>
          isNewSort || pageNum === 1 ? newReviews : [...prev, ...newReviews]
        );
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        setError('Erro ao carregar avaliações. Tente novamente.');
        setHasMore(false);

        toast({
          title: 'Erro ao carregar avaliações',
          description:
            'Não foi possível carregar as avaliações. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, sneakerId, sortOrder, itemsPerPage]
  );

  useEffect(() => {
    if (!dialogOpen || !observerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadMoreReviews(nextPage);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [dialogOpen, hasMore, loading, page, loadMoreReviews]);

  const handleOpenDialog = useCallback(() => {
    setPage(1);
    setDisplayedReviews([]);
    setHasMore(true);
    setError(null);
    setDialogOpen(true);
    loadMoreReviews(1, true);
  }, [loadMoreReviews]);

  const handleSortChange = useCallback(
    (newSort) => {
      setSortOrder(newSort);
      setPage(1);
      setDisplayedReviews([]);
      setHasMore(true);
      setError(null);
      loadMoreReviews(1, true);
    },
    [loadMoreReviews]
  );

  if (!initialReviews.length && totalReviews === 0) {
    return (
      <div className="py-6" id="reviews">
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma avaliação ainda
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
            Seja o primeiro a avaliar este produto e ajude outros clientes!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6" id="reviews">
      <div className="grid grid-cols-1 md:grid-cols-3 space-x-8 gap-8">
        {/* Resumo das avaliações melhorado */}
        <div className="bg-gradient-to-br h-fit from-gray-50 to-blue-50/30 p-6 rounded-xl border shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <StarFilledIcon
                    key={i}
                    className={`h-6 w-6 ${
                      i < Math.round(averageRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
            </div>
            <div className="text-sm text-gray-600">
              Baseado em <strong>{totalReviews}</strong>{' '}
              {totalReviews === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>

          {/* Barras de avaliação melhoradas */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{star}</span>
                  <StarFilledIcon className="h-3 w-3 text-yellow-400" />
                </div>

                <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${getRatingPercentage(star)}%` }}
                  />
                </div>

                <div className="text-xs text-gray-500 w-10 text-right">
                  {getRatingPercentage(star)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de avaliações */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Avaliações dos clientes
            </h3>
          </div>

          {/* Reviews iniciais */}
          <div className="space-y-6 mb-6">
            {initialReviews.map((review) => (
              <ReviewItem key={review._id} review={review} />
            ))}
          </div>

          {/* Botão "Ver todas" melhorado */}
          {hasMoreReviews && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleOpenDialog}
                className="px-8 py-2 hover:bg-primary hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ver todas as {totalReviews} avaliações
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog melhorado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="w-5 h-5 text-primary" />
              Todas as avaliações
              <Badge variant="secondary" className="ml-2">
                {totalReviews}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Controles de ordenação */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <p className="text-sm text-gray-600">
              Ordenado por:{' '}
              <strong>
                {sortOrder === 'recent'
                  ? 'Mais recentes'
                  : sortOrder === 'highest'
                  ? 'Maior avaliação'
                  : 'Menor avaliação'}
              </strong>
            </p>

            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="highest">Maior avaliação</SelectItem>
                <SelectItem value="lowest">Menor avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto pr-2">
            {error ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => loadMoreReviews(1, true)}
                  disabled={loading}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedReviews.map((review) => (
                  <ReviewItem key={review._id} review={review} />
                ))}

                {/* Loading indicator melhorado */}
                {loading && <ReviewSkeleton />}

                {/* Observer para scroll infinito */}
                {hasMore && !loading && (
                  <div
                    ref={observerRef}
                    className="py-4 flex items-center justify-center"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Fim da lista */}
                {!hasMore && displayedReviews.length > 0 && (
                  <div className="text-center py-6 border-t">
                    <p className="text-gray-500">
                      ✨ Você viu todas as avaliações!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reviews;
