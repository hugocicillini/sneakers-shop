import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSneakers } from '@/services/sneakers.service';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Filter from './Filter';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import SneakersList from './SneakersList';

const Sneakers = ({ search }) => {
  // Flag para controlar se é a primeira renderização
  const isFirstRender = useRef(true);
  // Referência para armazenar a última requisição
  const lastFetchTimestamp = useRef(0);
  // Armazenar os últimos parâmetros de busca para evitar duplicação
  const lastFetchParams = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [sneakersList, setSneakersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sneakersPerPage] = useState(10);
  const [totalSneakers, setTotalSneakers] = useState(0);

  // Inicializar sortBy a partir dos parâmetros de URL
  const [sortBy, setSortBy] = useState(
    searchParams.get('sortBy') || 'relevance'
  );

  const [activeFilters, setActiveFilters] = useState({
    brands: searchParams.get('brand')?.split(',').filter(Boolean) || [],
    sizes:
      searchParams.get('sizes')?.split(',').map(Number).filter(Boolean) || [],
    colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    price: {
      min: searchParams.get('minPrice') || '',
      max: searchParams.get('maxPrice') || '',
    },
    gender: searchParams.get('gender')?.split(',').filter(Boolean) || [],
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    sortBy: searchParams.get('sortBy') || 'relevance',
  });

  const sortOptions = [
    { value: 'relevance', label: 'Relevância' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'discount_desc', label: 'Maior desconto' },
    { value: 'newest', label: 'Mais recentes' },
  ];

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modificar a função fetchSneakers para usar memoização e evitar duplicação
  const fetchSneakers = useCallback(
    async (brandOrFilters = null) => {
      // Verificar se os parâmetros são os mesmos da última chamada
      const currentParams = JSON.stringify({
        page: currentPage,
        search,
        filters: brandOrFilters || activeFilters,
      });

      const now = Date.now();
      // Evitar chamadas duplicadas em menos de 300ms
      if (
        currentParams === lastFetchParams.current &&
        now - lastFetchTimestamp.current < 300
      ) {
        return;
      }

      setLoading(true);
      lastFetchParams.current = currentParams;
      lastFetchTimestamp.current = now;

      try {
        let filtersToApply;

        if (typeof brandOrFilters === 'string') {
          filtersToApply = { ...activeFilters, brands: [brandOrFilters] };
          setActiveFilters((prev) => ({ ...prev, brands: [brandOrFilters] }));
        } else if (brandOrFilters && typeof brandOrFilters === 'object') {
          filtersToApply = brandOrFilters;
        } else {
          filtersToApply = activeFilters;
        }

        const response = await getSneakers(
          currentPage,
          sneakersPerPage,
          search,
          filtersToApply
        );

        setSneakersList(response.data.sneakers);
        setTotalSneakers(response.data.total);
      } catch (error) {
        console.error('Error fetching sneakers:', error);
      }
      setLoading(false);
    },
    [currentPage, sneakersPerPage, search, activeFilters]
  );

  // Modificar o useEffect para evitar chamadas desnecessárias
  useEffect(() => {
    // Pular a primeira renderização para evitar chamadas duplicadas
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchSneakers();
      return;
    }

    // Usar um debounce para chamadas subsequentes
    const handler = setTimeout(() => {
      fetchSneakers();
    }, 100);

    return () => clearTimeout(handler);
  }, [currentPage, search, fetchSneakers]);

  // Sincronizar com mudanças nos parâmetros de URL
  useEffect(() => {
    const sortByParam = searchParams.get('sortBy');
    if (sortByParam !== sortBy) {
      setSortBy(sortByParam || 'relevance');
      setActiveFilters((prev) => ({
        ...prev,
        sortBy: sortByParam || 'relevance',
      }));
    }
  }, [searchParams, sortBy]);

  const handleFilterChange = (filters) => {
    // Preservar a ordenação atual quando filtros são aplicados
    const filtersWithCurrentSort = {
      ...filters,
      sortBy: sortBy,
    };

    setActiveFilters(filtersWithCurrentSort);
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
    fetchSneakers(filtersWithCurrentSort);
    setIsFilterOpen(false);
  };

  const handleSortChange = (sortValue) => {
    // Atualizar ordenação no estado
    setSortBy(sortValue);

    // Atualizar a ordenação nos filtros ativos
    const newFilters = { ...activeFilters, sortBy: sortValue };
    setActiveFilters(newFilters);

    // Atualizar na URL
    const params = new URLSearchParams(searchParams);
    if (sortValue && sortValue !== 'relevance') {
      params.set('sortBy', sortValue);
    } else {
      params.delete('sortBy');
    }
    setSearchParams(params);

    // Buscar com nova ordenação
    setCurrentPage(1);
    fetchSneakers(newFilters);
  };

  const getCurrentSortLabel = () => {
    return (
      sortOptions.find((option) => option.value === sortBy)?.label ||
      'Relevância'
    );
  };

  return (
    <div className="mx-auto px-4 py-8 relative">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-1/5 h-full hidden lg:block">
          <div className="h-full sticky top-4">
            <Filter onFilterChange={handleFilterChange} isMobile={false} />
          </div>
        </aside>

        <div className="lg:hidden w-full">
          <div className="flex justify-between items-center mb-4">
            <Filter
              onFilterChange={handleFilterChange}
              isMobile={true}
              isOpen={isFilterOpen}
              setIsOpen={setIsFilterOpen}
            />

            {/* Ordenação mobile */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm flex items-center gap-1"
                  >
                    <span>Ordenar por</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      className={sortBy === option.value ? 'bg-primary/10' : ''}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="lg:w-4/5 lg:pr-2 w-full">
          <div className="mb-6 hidden lg:flex items-center justify-between">
            <h2 className="font-bold"></h2>

            {/* Ordenação desktop */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ordenar por:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm flex items-center gap-1"
                  >
                    <span>{getCurrentSortLabel()}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      className={sortBy === option.value ? 'bg-primary/10' : ''}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <SneakersList sneakers={sneakersList} fetchSneakers={fetchSneakers} />

          {totalSneakers > 0 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={
                        currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                      }
                      href="#"
                    />
                  </PaginationItem>

                  {(() => {
                    const totalPages = Math.ceil(
                      totalSneakers / sneakersPerPage
                    );
                    const pages = [];
                    const maxVisiblePages = 5;

                    if (totalPages <= maxVisiblePages) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === i}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(i);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    } else {
                      pages.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );

                      if (currentPage > 3) {
                        pages.push(
                          <PaginationItem key="ellipsis-1">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      const startPage = Math.max(2, currentPage - 1);
                      const endPage = Math.min(totalPages - 1, currentPage + 1);

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === i}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(i);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      if (currentPage < totalPages - 2) {
                        pages.push(
                          <PaginationItem key="ellipsis-2">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      pages.push(
                        <PaginationItem key={totalPages}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === totalPages}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(totalPages);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    return pages;
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        const totalPages = Math.ceil(
                          totalSneakers / sneakersPerPage
                        );
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={
                        currentPage >=
                        Math.ceil(totalSneakers / sneakersPerPage)
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                      href="#"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Sneakers;
