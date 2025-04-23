import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSneakers } from '@/services/sneakers.service';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import Filter from './Filter';
import SneakersList from './SneakersList';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

const Sneakers = ({ search }) => {
  const [sneakersList, setSneakersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sneakersPerPage] = useState(20);
  const [totalSneakers, setTotalSneakers] = useState(0);
  const [sortBy, setSortBy] = useState('relevance'); // Garante que inicia com a ordenação por relevância
  const [activeFilters, setActiveFilters] = useState({
    brands: [],
    sizes: [],
    colors: [],
    price: { min: '', max: '' },
    gender: [],
    tags: [],
    sortBy: 'relevance', // Também aqui
  });

  const sortOptions = [
    { value: 'relevance', label: 'Relevância' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'discount_desc', label: 'Maior desconto' },
    { value: 'newest', label: 'Mais recentes' },
  ];

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchSneakers = async (brandOrFilters = null) => {
    setLoading(true);
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

      setSneakersList(response.data);
      setTotalSneakers(response.total);
    } catch (error) {
      console.error('Error fetching sneakers:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSneakers();
  }, [currentPage, search]);

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    setSortBy('relevance'); // Atualiza a ordenação com base nos filtros
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
    fetchSneakers(filters);
    setIsFilterOpen(false);
  };

  const handleSortChange = (sortValue) => {
    setSortBy(sortValue);
    setCurrentPage(1); // Resetar para a primeira página ao aplicar ordenação
    const newFilters = { ...activeFilters, sortBy: sortValue };
    setActiveFilters(newFilters);
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
