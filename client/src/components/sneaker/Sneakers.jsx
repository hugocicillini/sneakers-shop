import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSneakers } from '@/services/sneakers.service';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import BannerShipping from './BannerShipping';
import Filter from './Filter';
import SneakersList from './SneakersList';

const Sneakers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sneakersList, setSneakersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSneakers, setTotalSneakers] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sneakersPerPage = 10;

  const currentPage = useMemo(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    return Math.max(1, pageFromUrl);
  }, [searchParams]);

  const sortBy = useMemo(() => {
    return searchParams.get('sortBy') || 'relevance';
  }, [searchParams]);

  const activeFilters = useMemo(() => {
    return {
      brands: searchParams.get('brand')?.split(',').filter(Boolean) || [],
      sizes:
        searchParams.get('sizes')?.split(',').map(Number).filter(Boolean) || [],
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      price: {
        min: searchParams.get('minPrice') || '',
        max: searchParams.get('maxPrice') || '',
      },
      gender: searchParams.get('gender')?.split(',').filter(Boolean) || [],
      category: searchParams.get('category')?.split(',').filter(Boolean) || [],
      sortBy: sortBy,
    };
  }, [searchParams, sortBy]);

  const sortOptions = [
    { value: 'relevance', label: 'Relevância' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'discount_desc', label: 'Maior desconto' },
    { value: 'newest', label: 'Mais recentes' },
  ];

  const fetchSneakers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSneakers(
        currentPage,
        sneakersPerPage,
        '',
        activeFilters
      );

      setSneakersList(response.data.sneakers);
      setTotalSneakers(response.data.total);
    } catch (error) {
      console.error('Error fetching sneakers:', error);
    }
    setLoading(false);
  }, [currentPage, sneakersPerPage, activeFilters]);

  useEffect(() => {
    fetchSneakers();
  }, [fetchSneakers]);

  const handleFilterChange = useCallback(
    (filters) => {
      const filtersWithCurrentSort = {
        ...filters,
        sortBy: sortBy,
      };

      const params = new URLSearchParams();

      if (filtersWithCurrentSort.brands?.length > 0) {
        params.set('brand', filtersWithCurrentSort.brands.join(','));
      }
      if (filtersWithCurrentSort.sizes?.length > 0) {
        params.set('sizes', filtersWithCurrentSort.sizes.join(','));
      }
      if (filtersWithCurrentSort.colors?.length > 0) {
        params.set('colors', filtersWithCurrentSort.colors.join(','));
      }
      if (filtersWithCurrentSort.gender?.length > 0) {
        params.set('gender', filtersWithCurrentSort.gender.join(','));
      }
      if (filtersWithCurrentSort.category?.length > 0) {
        params.set('category', filtersWithCurrentSort.category.join(','));
      }
      if (filtersWithCurrentSort.price?.min) {
        params.set('minPrice', filtersWithCurrentSort.price.min);
      }
      if (filtersWithCurrentSort.price?.max) {
        params.set('maxPrice', filtersWithCurrentSort.price.max);
      }
      if (
        filtersWithCurrentSort.sortBy &&
        filtersWithCurrentSort.sortBy !== 'relevance'
      ) {
        params.set('sortBy', filtersWithCurrentSort.sortBy);
      }

      params.delete('page');

      setSearchParams(params);
      setIsFilterOpen(false);
    },
    [sortBy, setSearchParams]
  );

  const handleSortChange = useCallback(
    (sortValue) => {
      const params = new URLSearchParams(searchParams);

      if (sortValue && sortValue !== 'relevance') {
        params.set('sortBy', sortValue);
      } else {
        params.delete('sortBy');
      }

      params.delete('page');

      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const currentSortLabel = useMemo(() => {
    return (
      sortOptions.find((option) => option.value === sortBy)?.label ||
      'Relevância'
    );
  }, [sortBy, sortOptions]);

  const paginationPages = useMemo(() => {
    const totalPages = Math.ceil(totalSneakers / sneakersPerPage);
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-1');
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-2');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return { pages, totalPages };
  }, [totalSneakers, sneakersPerPage, currentPage]);

  const handlePageChange = useCallback(
    (page) => {
      const params = new URLSearchParams(searchParams);

      if (page > 1) {
        params.set('page', page.toString());
      } else {
        params.delete('page');
      }

      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, setSearchParams]
  );

  const SortDropdown = ({ isMobile = false }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="text-sm flex items-center gap-1">
          <span>{isMobile ? 'Ordenar por' : currentSortLabel}</span>
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
  );

  return (
    <div className="mx-auto px-4 py-8 relative">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Desktop */}
        <aside className="lg:w-1/5 h-full hidden lg:block">
          <div className="h-full sticky top-4">
            <Filter onFilterChange={handleFilterChange} isMobile={false} />
          </div>
        </aside>

        {/* Mobile Controls */}
        <div className="lg:hidden w-full">
          <div className="flex justify-between items-center mb-4">
            <Filter
              onFilterChange={handleFilterChange}
              isMobile={true}
              isOpen={isFilterOpen}
              setIsOpen={setIsFilterOpen}
            />
            <SortDropdown isMobile={true} />
          </div>
        </div>

        {/* Main Content */}
        <main className="lg:w-4/5 lg:pr-2 w-full">
          {/* Desktop Sort */}

          <BannerShipping />

          <div className="mb-6 hidden lg:flex items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ordenar por:</span>
              <SortDropdown />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <SneakersList sneakers={sneakersList} />

              {/* Pagination */}
              {totalSneakers > 0 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            if (currentPage > 1) {
                              handlePageChange(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage <= 1
                              ? 'pointer-events-none opacity-50'
                              : ''
                          }
                          href="#"
                        />
                      </PaginationItem>

                      {paginationPages.pages.map((page, index) => (
                        <PaginationItem
                          key={typeof page === 'string' ? page : `page-${page}`}
                        >
                          {typeof page === 'string' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={currentPage === page}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            if (currentPage < paginationPages.totalPages) {
                              handlePageChange(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage >= paginationPages.totalPages
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
            </>
          )}

          {/* Empty State */}
          {!loading && sneakersList.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Sneakers;
