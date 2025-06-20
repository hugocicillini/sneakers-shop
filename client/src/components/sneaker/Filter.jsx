import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Filter as FilterIcon,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { DualRangeSlider } from '../ui/slider-dual';

const MIN_PRICE = 0;
const MAX_PRICE = 1000;

const BRANDS = [
  'Nike',
  'Adidas',
  'Converse',
  'New Balance',
  'Asics',
  'Puma',
  'Vans',
];
const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const COLORS = [
  'Preto',
  'Branco',
  'Vermelho',
  'Azul',
  'Verde',
  'Amarelo',
  'Cinza',
  'Laranja',
  'Rosa',
];

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'unisex', label: 'Unisex' },
];

const CATEGORY_OPTIONS = [
  { value: 'corrida', label: 'Corrida' },
  { value: 'casual', label: 'Casual' },
  { value: 'esportivo', label: 'Esportivo' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'treino', label: 'Treino' },
  { value: 'skateboard', label: 'Skateboard' },
  { value: 'basquete', label: 'Basquete' },
  { value: 'futebol', label: 'Futebol' },
];

const FilterSection = memo(
  ({
    title,
    children,
    section,
    expandedSections,
    setExpandedSections,
    hasActiveFilters = false,
  }) => (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div
        className="flex justify-between items-center cursor-pointer mb-2 group"
        onClick={() =>
          setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
          }))
        }
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium group-hover:text-primary transition-colors">
            {title}
          </h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-5 text-xs">
              Ativo
            </Badge>
          )}
        </div>
        {expandedSections[section] ? (
          <ChevronUp
            size={18}
            className="text-gray-500 group-hover:text-primary transition-colors"
          />
        ) : (
          <ChevronDown
            size={18}
            className="text-gray-500 group-hover:text-primary transition-colors"
          />
        )}
      </div>
      {expandedSections[section] && (
        <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
);

const Filter = ({
  onFilterChange,
  isMobile = false,
  isOpen = false,
  setIsOpen = null,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const openState = setIsOpen ? isOpen : internalIsOpen;
  const setOpenState = setIsOpen || setInternalIsOpen;

  const initializeFilters = useCallback(() => {
    return {
      brands: searchParams.get('brand')?.split(',').filter(Boolean) || [],
      sizes:
        searchParams.get('sizes')?.split(',').map(Number).filter(Boolean) || [],
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      gender: searchParams.get('gender')?.split(',').filter(Boolean) || [],
      category: searchParams.get('category')?.split(',').filter(Boolean) || [],
      price: {
        min: searchParams.get('minPrice') || '',
        max: searchParams.get('maxPrice') || '',
      },
      sortBy: searchParams.get('sortBy') || 'relevance',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(initializeFilters);

  useEffect(() => {
    setFilters(initializeFilters());
  }, [initializeFilters]);

  const [priceRange, setPriceRange] = useState(() => [
    filters.price.min ? Number(filters.price.min) : MIN_PRICE,
    filters.price.max ? Number(filters.price.max) : MAX_PRICE,
  ]);

  const [expandedSections, setExpandedSections] = useState(() => {
    const urlFilters = initializeFilters();
    return {
      brands: urlFilters.brands.length > 0,
      sizes: urlFilters.sizes.length > 0,
      colors: urlFilters.colors.length > 0,
      gender: urlFilters.gender.length > 0,
      category: urlFilters.category.length > 0,
      price: !!(urlFilters.price.min || urlFilters.price.max),
    };
  });

  const activeFiltersCount = useMemo(() => {
    return (
      filters.brands.length +
      filters.sizes.length +
      filters.colors.length +
      filters.gender.length +
      filters.category.length +
      (filters.price.min || filters.price.max ? 1 : 0)
    );
  }, [filters]);

  const updateUrlParams = useCallback(
    (newFilters) => {
      const params = new URLSearchParams(searchParams);

      const setOrDeleteParam = (key, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else {
          params.set(key, Array.isArray(value) ? value.join(',') : value);
        }
      };

      setOrDeleteParam('brand', newFilters.brands);
      setOrDeleteParam('sizes', newFilters.sizes);
      setOrDeleteParam('colors', newFilters.colors);
      setOrDeleteParam('gender', newFilters.gender);
      setOrDeleteParam('category', newFilters.category);
      setOrDeleteParam('minPrice', newFilters.price.min);
      setOrDeleteParam('maxPrice', newFilters.price.max);

      if (newFilters.sortBy && newFilters.sortBy !== 'relevance') {
        params.set('sortBy', newFilters.sortBy);
      } else {
        params.delete('sortBy');
      }

      setSearchParams(params);
      onFilterChange?.(newFilters);
    },
    [searchParams, setSearchParams, onFilterChange]
  );
  
  const createToggleHandler = useCallback((filterKey, section) => {
    return (value) => {
      setExpandedSections((prev) => ({ ...prev, [section]: true }));
      setFilters((prev) => {
        const currentArray = prev[filterKey];
        const newArray = currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value];
        return { ...prev, [filterKey]: newArray };
      });
    };
  }, []);

  const handleBrandChange = createToggleHandler('brands', 'brands');
  const handleSizeChange = createToggleHandler('sizes', 'sizes');
  const handleColorChange = createToggleHandler('colors', 'colors');
  const handleGenderChange = createToggleHandler('gender', 'gender');
  const handleCategoryChange = createToggleHandler('category', 'category');

  const handlePriceSliderChange = useCallback((value) => {
    setExpandedSections((prev) => ({ ...prev, price: true }));
    setPriceRange(value);
    setFilters((prev) => ({
      ...prev,
      price: {
        min: value[0] === MIN_PRICE ? '' : value[0].toString(),
        max: value[1] === MAX_PRICE ? '' : value[1].toString(),
      },
    }));
  }, []);

  const applyAllFilters = useCallback(() => {
    const currentSortBy = searchParams.get('sortBy') || 'relevance';
    const filtersToApply = { ...filters, sortBy: currentSortBy };
    updateUrlParams(filtersToApply);
    setOpenState(false);
  }, [filters, searchParams, updateUrlParams, setOpenState]);

  const clearAllFilters = useCallback(() => {
    const resetFilters = {
      brands: [],
      sizes: [],
      colors: [],
      price: { min: '', max: '' },
      gender: [],
      category: [],
      sortBy: searchParams.get('sortBy') || 'relevance',
    };
    setFilters(resetFilters);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    updateUrlParams(resetFilters);
    setExpandedSections({
      brands: false,
      sizes: false,
      colors: false,
      gender: false,
      category: false,
      price: false,
    });
  }, [searchParams, updateUrlParams]);

  const FilterButtons = memo(
    ({ items, activeItems, onToggle, variant = 'tags' }) => (
      <div
        className={cn(
          'flex flex-wrap gap-2',
          variant === 'sizes' && 'grid grid-cols-5 gap-2'
        )}
      >
        {items.map((item) => {
          const value = typeof item === 'object' ? item.value : item;
          const label = typeof item === 'object' ? item.label : item;
          const isActive = activeItems.includes(value);

          return (
            <Button
              key={value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'transition-all duration-200',
                variant === 'sizes' && 'h-10 w-full rounded-md aspect-square',
                isActive && 'ring-2 ring-primary/20'
              )}
              onClick={() => onToggle(value)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    )
  );

  const MobileModal = memo(() => (
    <div
      className="fixed inset-0 bg-black/70 z-[9999]"
      onClick={() => setOpenState(false)}
    >
      <div
        className="fixed inset-y-0 right-0 bg-white z-[10000] w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <FilterIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Filtros</h2>
              {activeFiltersCount > 0 && (
                <Badge className="bg-primary text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenState(false)}
            >
              <X size={24} />
            </Button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-4">
            <FilterSection
              title="Gênero"
              section="gender"
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              hasActiveFilters={filters.gender.length > 0}
            >
              <div className="space-y-3">
                {GENDER_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`gender-mobile-${option.value}`}
                      checked={filters.gender.includes(option.value)}
                      onCheckedChange={() => handleGenderChange(option.value)}
                    />
                    <Label
                      htmlFor={`gender-mobile-${option.value}`}
                      className="text-sm"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Categorias"
              section="category"
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              hasActiveFilters={filters.category.length > 0}
            >
              <FilterButtons
                items={CATEGORY_OPTIONS}
                activeItems={filters.category}
                onToggle={handleCategoryChange}
              />
            </FilterSection>

            <FilterSection
              title="Marca"
              section="brands"
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              hasActiveFilters={filters.brands.length > 0}
            >
              <FilterButtons
                items={BRANDS}
                activeItems={filters.brands}
                onToggle={handleBrandChange}
              />
            </FilterSection>

            <FilterSection
              title="Tamanho"
              section="sizes"
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              hasActiveFilters={filters.sizes.length > 0}
            >
              <FilterButtons
                items={SIZES}
                activeItems={filters.sizes}
                onToggle={handleSizeChange}
                variant="sizes"
              />
            </FilterSection>

            <FilterSection
              title="Cor"
              section="colors"
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              hasActiveFilters={filters.colors.length > 0}
            >
              <FilterButtons
                items={COLORS}
                activeItems={filters.colors}
                onToggle={handleColorChange}
              />
            </FilterSection>

            <FilterSection
              title="Faixa de preço"
              section="price"
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              hasActiveFilters={!!(filters.price.min || filters.price.max)}
            >
              <div className="px-1 pb-6 pt-4">
                <DualRangeSlider
                  value={priceRange}
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  onValueChange={handlePriceSliderChange}
                  className="mb-4"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    R$ {priceRange[0]}
                  </span>
                  <span className="font-medium text-gray-700">
                    R${' '}
                    {priceRange[1] === MAX_PRICE
                      ? `${MAX_PRICE}+`
                      : priceRange[1]}
                  </span>
                </div>
              </div>
            </FilterSection>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 space-y-3">
            <Button
              variant="default"
              className="w-full h-12 text-base font-medium"
              onClick={applyAllFilters}
            >
              <Search size={18} className="mr-2" />
              Aplicar filtros
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={clearAllFilters}
              >
                <RotateCcw size={16} className="mr-2" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  ));

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setOpenState(true)}
          className="flex items-center gap-2 relative"
        >
          <FilterIcon size={18} />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-primary text-white h-5 w-5 text-xs p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {openState && <MobileModal />}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky lg:top-4 bg-white p-6 rounded-xl shadow-sm h-full flex flex-col border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FilterIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Filtros</h2>
            {activeFiltersCount > 0 && (
              <Badge className="bg-primary text-white">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-red-600"
            >
              <RotateCcw size={16} />
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto space-y-1">
          <FilterSection
            title="Gênero"
            section="gender"
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            hasActiveFilters={filters.gender.length > 0}
          >
            <div className="space-y-3">
              {GENDER_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`gender-desktop-${option.value}`}
                    checked={filters.gender.includes(option.value)}
                    onCheckedChange={() => handleGenderChange(option.value)}
                  />
                  <Label
                    htmlFor={`gender-desktop-${option.value}`}
                    className="text-sm"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Categorias"
            section="category"
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            hasActiveFilters={filters.category.length > 0}
          >
            <FilterButtons
              items={CATEGORY_OPTIONS}
              activeItems={filters.category}
              onToggle={handleCategoryChange}
            />
          </FilterSection>

          <FilterSection
            title="Marca"
            section="brands"
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            hasActiveFilters={filters.brands.length > 0}
          >
            <FilterButtons
              items={BRANDS}
              activeItems={filters.brands}
              onToggle={handleBrandChange}
            />
          </FilterSection>

          <FilterSection
            title="Tamanho"
            section="sizes"
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            hasActiveFilters={filters.sizes.length > 0}
          >
            <FilterButtons
              items={SIZES}
              activeItems={filters.sizes}
              onToggle={handleSizeChange}
              variant="sizes"
            />
          </FilterSection>

          <FilterSection
            title="Cor"
            section="colors"
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            hasActiveFilters={filters.colors.length > 0}
          >
            <FilterButtons
              items={COLORS}
              activeItems={filters.colors}
              onToggle={handleColorChange}
            />
          </FilterSection>

          <FilterSection
            title="Faixa de preço"
            section="price"
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            hasActiveFilters={!!(filters.price.min || filters.price.max)}
          >
            <div className="px-1 pb-6 pt-4">
              <DualRangeSlider
                value={priceRange}
                min={MIN_PRICE}
                max={MAX_PRICE}
                onValueChange={handlePriceSliderChange}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  R$ {priceRange[0]}
                </span>
                <span className="font-medium text-gray-700">
                  R${' '}
                  {priceRange[1] === MAX_PRICE
                    ? `${MAX_PRICE}+`
                    : priceRange[1]}
                </span>
              </div>
            </div>
          </FilterSection>
        </div>

        <div className="mt-6 pt-4 border-t space-y-3">
          <Button
            variant="default"
            className="w-full h-12 text-base font-medium"
            onClick={applyAllFilters}
          >
            <Search size={18} className="mr-2" />
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(Filter);
