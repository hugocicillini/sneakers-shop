import StarRating from '@/components/sneaker/StarRating';
import LayoutBase from '@/layout/LayoutBase';
import { getSneakers } from '@/services/sneakers.service';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const SearchFound = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Refs para intersection observer
  const observerRef = useRef();
  const lastSearchRef = useRef('');

  const itemsPerPage = 12; // Número de itens por página

  // Memoizar o termo de pesquisa
  const searchTerm = useMemo(() => {
    return searchParams.get('q')?.trim() || '';
  }, [searchParams]);

  // Função para buscar resultados com paginação
  const fetchResults = useCallback(
    async (query, page = 1, isLoadMore = false) => {
      if (!query) {
        setResults([]);
        setHasMore(false);
        setTotalResults(0);
        return;
      }

      // Evitar múltiplas chamadas para a mesma busca
      if (query === lastSearchRef.current && page === 1 && !isLoadMore) {
        return;
      }

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setResults([]);
        setCurrentPage(1);
        setHasMore(true);
        lastSearchRef.current = query;
      }

      setError(null);

      try {
        const response = await getSneakers(page, itemsPerPage, query, {});

        const data = response?.data?.sneakers || [];
        const total = response?.data?.total || 0;

        if (isLoadMore) {
          // Adicionar novos resultados aos existentes
          setResults((prev) => [...prev, ...data]);
        } else {
          // Substituir resultados (nova busca)
          setResults(data);
        }

        setTotalResults(total);
        setCurrentPage(page);

        // Verificar se há mais páginas
        const totalPages = Math.ceil(total / itemsPerPage);
        setHasMore(page < totalPages);
      } catch (error) {
        console.error('Erro ao buscar resultados:', error);
        setError('Erro ao carregar resultados. Tente novamente.');
        if (!isLoadMore) {
          setResults([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [itemsPerPage]
  );

  // Função para carregar mais resultados
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && searchTerm) {
      fetchResults(searchTerm, currentPage + 1, true);
    }
  }, [fetchResults, searchTerm, currentPage, loadingMore, hasMore]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Carregar um pouco antes de chegar ao final
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [loadMore, hasMore, loadingMore, loading]);

  // Efeito para realizar busca quando searchTerm muda
  useEffect(() => {
    fetchResults(searchTerm);
  }, [searchTerm, fetchResults]);

  // Scroll to top quando nova busca é realizada
  useEffect(() => {
    if (searchTerm && currentPage === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchTerm, currentPage]);

  // Componente de Loading inicial
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-gray-600">Buscando produtos...</p>
    </div>
  );

  // Componente de Loading para mais itens
  const LoadingMore = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
      <p className="text-sm text-gray-600">Carregando mais produtos...</p>
    </div>
  );

  // Componente de Estado Vazio
  const EmptyState = ({ message, description }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
      <p className="text-gray-600 max-w-md">{description}</p>
    </div>
  );

  // Componente de Erro
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Ops! Algo deu errado
      </h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => fetchResults(searchTerm)}
        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );

  // Componente de Card do Produto otimizado
  const ProductCard = ({ sneaker }) => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
      <Link to={`/sneaker/${sneaker.slug}`} className="block">
        {/* Imagem do Produto */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={sneaker.coverImage?.url || '/placeholder-product.png'}
            alt={sneaker.coverImage?.alt || sneaker.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badge de desconto */}
          {sneaker.baseDiscount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              -{sneaker.baseDiscount}%
            </div>
          )}

          {/* Badge de novo produto */}
          {sneaker.isNew && (
            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              NOVO
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="p-4">
          {/* Marca */}
          <div className="flex items-center mb-2">
            {sneaker.brand?.logo && (
              <img
                src={sneaker.brand.logo}
                alt={`Logo ${sneaker.brand.name}`}
                className="h-4 w-auto mr-2 object-contain"
                loading="lazy"
              />
            )}
            <span className="text-sm text-gray-600 font-medium">
              {sneaker.brand?.name || 'Sem marca'}
            </span>
          </div>

          {/* Nome do Produto */}
          <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {sneaker.name}
          </h3>

          {/* Tags */}
          <div className="mb-3 flex flex-wrap gap-1">
            {sneaker.category?.name && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {sneaker.category.name}
              </span>
            )}
            {sneaker.defaultColor && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {sneaker.defaultColor}
              </span>
            )}
          </div>

          {/* Avaliações */}
          <div className="mb-3">
            <StarRating
              rating={sneaker.rating || 0}
              reviewCount={sneaker.reviewCount || 0}
              size="sm"
            />
          </div>

          {/* Preço */}
          <div className="flex flex-col">
            {sneaker.baseDiscount > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    R$ {(sneaker.finalPrice || 0).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    R$ {(sneaker.basePrice || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  Economize R${' '}
                  {((sneaker.basePrice || 0) - (sneaker.finalPrice || 0))
                    .toFixed(2)
                    .replace('.', ',')}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                R${' '}
                {(sneaker.finalPrice || sneaker.basePrice || 0)
                  .toFixed(2)
                  .replace('.', ',')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );

  // Função para renderizar conteúdo principal
  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (error && results.length === 0) {
      return <ErrorState />;
    }

    if (!searchTerm) {
      return (
        <EmptyState
          message="Digite algo para pesquisar"
          description="Use a barra de pesquisa acima para encontrar os produtos que você procura."
        />
      );
    }

    if (results.length === 0 && !loading) {
      return (
        <EmptyState
          message={`Nenhum resultado para "${searchTerm}"`}
          description="Tente pesquisar com palavras-chave diferentes ou verifique a ortografia."
        />
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((sneaker) => (
            <ProductCard
              key={`${sneaker._id}-${sneaker.slug}`}
              sneaker={sneaker}
            />
          ))}
        </div>

        {/* Loading More */}
        {loadingMore && <LoadingMore />}

        {/* Intersection Observer Target */}
        {hasMore && !loadingMore && (
          <div
            ref={observerRef}
            className="h-10 flex items-center justify-center"
          >
            <div className="text-sm text-gray-500">Carregando mais...</div>
          </div>
        )}
      </>
    );
  };

  return (
    <LayoutBase>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {searchTerm ? `Resultados para "${searchTerm}"` : 'Pesquisa'}
            </h1>

            <p className="text-gray-600">
              {totalResults}
              {totalResults === 1
                ? ' resultado encontrado'
                : ' resultados encontrados'}
            </p>
          </div>

          {/* Conteúdo Principal */}
          {renderContent()}
        </div>
      </div>
    </LayoutBase>
  );
};

export default SearchFound;
