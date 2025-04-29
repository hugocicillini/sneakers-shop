import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSneakerReviews } from '@/services/reviews.service';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const Reviews = ({
  initialReviews = [],
  sneakerId,
  totalReviews = 0,
  averageRating = 0,
}) => {
  // Estado para o diálogo e paginação
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('recent');
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Referência para o observador do scroll infinito
  const observerRef = useRef(null);

  // Configurações
  const itemsPerPage = 10;

  // Indicador se há mais reviews para mostrar além das iniciais
  const hasMoreReviews = totalReviews > initialReviews.length;

  // Carregar mais avaliações quando necessário
  useEffect(() => {
    const loadMoreReviews = async () => {
      if (!shouldFetch || !dialogOpen || !hasMore || loading) return;

      try {
        setLoading(true);
        const response = await getSneakerReviews(sneakerId, {
          page,
          limit: itemsPerPage,
          sort: sortOrder,
        });

        const newReviews = response.data || [];

        // Verificar se há mais páginas
        setHasMore(newReviews.length === itemsPerPage);

        // Atualizar lista de reviews
        setDisplayedReviews((prev) =>
          page === 1 ? newReviews : [...prev, ...newReviews]
        );
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setShouldFetch(false);
      }
    };

    loadMoreReviews();
  }, [shouldFetch, dialogOpen, sneakerId, page, sortOrder, hasMore, loading]);

  // Configurar observador para o scroll infinito
  useEffect(() => {
    if (!dialogOpen || !observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
          setShouldFetch(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [dialogOpen, hasMore, loading]);

  // Calcular percentuais de avaliação por estrela
  const getRatingPercentage = (star) => {
    if (!initialReviews.length) return 0;

    const count = initialReviews.filter(
      (review) => Number(review.rating) === star
    ).length;
    return Math.round((count / initialReviews.length) * 100);
  };

  // Abrir o diálogo de todas as avaliações
  const openAllReviews = () => {
    setPage(1);
    setDisplayedReviews([]);
    setHasMore(true);
    setDialogOpen(true);
    setShouldFetch(true);
  };

  // Se não há reviews, mostrar mensagem
  if (!initialReviews.length) {
    return (
      <div className="py-6">
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            Este produto ainda não possui avaliações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Resumo das avaliações */}
        <div className="bg-gray-50 p-4 max-h-fit rounded-lg">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center my-2">
              {[...Array(5)].map((_, i) => (
                <StarFilledIcon
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500">
              {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>

          {/* Barras de avaliação */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center">
                <div className="w-16 flex">
                  {[...Array(5)].map((_, i) => (
                    <StarFilledIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex-grow h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${getRatingPercentage(star)}%` }}
                  ></div>
                </div>
                <div className="w-10 text-xs text-gray-500">
                  {getRatingPercentage(star)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de avaliações */}
        <div className="md:col-span-2">
          <div className="flex justify-between mb-4">
            <div className="font-medium">Avaliações recentes</div>
          </div>

          {/* Reviews iniciais */}
          <div className="space-y-6">
            {initialReviews.map((review) => (
              <ReviewItem key={review._id} review={review} />
            ))}
          </div>

          {/* Botão "Ver todas" - só aparece se há mais reviews */}
          {hasMoreReviews && (
            <div className="mt-6 flex justify-center">
              <button
                className="px-6 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                onClick={openAllReviews}
              >
                Ver todas as {totalReviews} avaliações
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo para mostrar todas as avaliações */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Todas as avaliações</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
                setDisplayedReviews([]);
                setHasMore(true);
                setShouldFetch(true);
              }}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="recent">Mais recentes</option>
              <option value="highest">Maior avaliação</option>
              <option value="lowest">Menor avaliação</option>
            </select>
          </div>
          <div
            className="overflow-y-auto pr-2"
            style={{ maxHeight: 'calc(80vh - 170px)' }}
          >
            <div className="space-y-6">
              {displayedReviews.map((review) => (
                <ReviewItem key={review._id} review={review} />
              ))}
            </div>

            {/* Indicador de carregamento para scroll infinito */}
            {hasMore && (
              <div
                ref={observerRef}
                className="py-4 flex items-center justify-center"
              >
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {!hasMore && displayedReviews.length > 0 && (
              <p className="text-center text-gray-500 py-4">
                Não há mais avaliações!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente de item de avaliação
const ReviewItem = ({ review }) => {
  return (
    <div className="border-b pb-4">
      <div className="flex justify-between mb-2">
        <div>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarFilledIcon
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(review.date), "d 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}
        </div>
      </div>

      <div className="flex items-center mb-2">
        <div className="font-medium">{review.user?.name || 'Cliente'}</div>
        {review.isVerified && (
          <div className="flex items-center ml-2 text-xs text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Compra verificada
          </div>
        )}
      </div>

      <p className="text-gray-700">{review.comment}</p>
    </div>
  );
};

export default Reviews;
