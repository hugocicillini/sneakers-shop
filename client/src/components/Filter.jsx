import {
  ChevronDown,
  ChevronUp,
  Filter as FilterIcon,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { DualRangeSlider } from './ui/slider-dual';

const Filter = ({
  onFilterChange,
  isMobile = false,
  isOpen = false,
  setIsOpen = null,
}) => {
  // Estado interno para quando não é fornecido controle externo
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Usar o estado fornecido por props ou o interno
  const openState = setIsOpen ? isOpen : internalIsOpen;
  const setOpenState = setIsOpen || setInternalIsOpen;

  const MIN_PRICE = 0;
  const MAX_PRICE = 1000;

  // Inicializar filtros a partir dos parâmetros da URL
  const [filters, setFilters] = useState(() => {
    const urlFilters = {
      // Ajustado para corresponder aos nomes de parâmetros no backend
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
    return urlFilters;
  });

  // Inicializar o price range baseado nos parâmetros de URL
  const [priceRange, setPriceRange] = useState([
    filters.price.min ? Number(filters.price.min) : MIN_PRICE,
    filters.price.max ? Number(filters.price.max) : MAX_PRICE,
  ]);

  // Inicializar expandedSections com base nas seleções existentes
  const [expandedSections, setExpandedSections] = useState(() => {
    // Verificar quais seções têm filtros ativos
    const sectionsToExpand = {
      brands: false,
      sizes: false,
      colors: false,
      price: false,
      gender: false,
      category: false,
    };

    const urlFilters = {
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
    };

    // Expandir seções com filtros ativos
    if (urlFilters.brands.length > 0) sectionsToExpand.brands = true;
    if (urlFilters.sizes.length > 0) sectionsToExpand.sizes = true;
    if (urlFilters.colors.length > 0) sectionsToExpand.colors = true;
    if (urlFilters.gender.length > 0) sectionsToExpand.gender = true;
    if (urlFilters.category.length > 0) sectionsToExpand.category = true;
    if (urlFilters.price.min || urlFilters.price.max)
      sectionsToExpand.price = true;

    return sectionsToExpand;
  });

  // Element para portal
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  // Atualizar a URL quando os filtros mudarem
  const updateUrlParams = (newFilters) => {
    const params = new URLSearchParams(searchParams);

    // Remover parâmetros vazios e usar os nomes corretos para o backend
    if (newFilters.brands.length === 0) {
      params.delete('brand');
    } else {
      params.set('brand', newFilters.brands.join(','));
    }

    if (newFilters.sizes.length === 0) {
      params.delete('sizes');
    } else {
      params.set('sizes', newFilters.sizes.join(','));
    }

    if (newFilters.colors.length === 0) {
      params.delete('colors');
    } else {
      params.set('colors', newFilters.colors.join(','));
    }

    if (newFilters.gender.length === 0) {
      params.delete('gender');
    } else {
      params.set('gender', newFilters.gender.join(','));
    }

    if (newFilters.category.length === 0) {
      params.delete('category');
    } else {
      params.set('category', newFilters.category.join(','));
    }

    if (newFilters.price.min) {
      params.set('minPrice', newFilters.price.min);
    } else {
      params.delete('minPrice');
    }

    if (newFilters.price.max) {
      params.set('maxPrice', newFilters.price.max);
    } else {
      params.delete('maxPrice');
    }

    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') {
      params.set('sortBy', newFilters.sortBy);
    } else {
      params.delete('sortBy');
    }

    setSearchParams(params);

    // Notificar o componente pai sobre a mudança
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const brands = [
    'Nike',
    'Adidas',
    'Converse',
    'New Balance',
    'Asics',
    'Puma',
    'Vans',
  ];
  const sizes = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
  const colors = [
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

  // Novas opções para filtros
  const genderOptions = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'unisex', label: 'Unisex' },
  ];

  const tagOptions = [
    { value: 'corrida', label: 'Corrida' },
    { value: 'casual', label: 'Casual' },
    { value: 'esportivo', label: 'Esportivo' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'treino', label: 'Treino' },
    { value: 'skateboard', label: 'Skateboard' },
    { value: 'basquete', label: 'Basquete' },
    { value: 'futebol', label: 'Futebol' },
  ];

  const expandSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: true,
    }));
  };

  const handleBrandChange = (brand) => {
    expandSection('brands');
    setFilters((prev) => {
      const newBrands = prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand];
      return { ...prev, brands: newBrands };
      // Remoção da atualização imediata dos parâmetros da URL
    });
  };

  const handleSizeChange = (size) => {
    expandSection('sizes');
    setFilters((prev) => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: newSizes };
      // Remoção da atualização imediata dos parâmetros da URL
    });
  };

  const handleColorChange = (color) => {
    expandSection('colors');
    setFilters((prev) => {
      const newColors = prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors: newColors };
      // Remoção da atualização imediata dos parâmetros da URL
    });
  };

  const handlePriceSliderChange = (value) => {
    expandSection('price');
    setPriceRange(value);
    setFilters((prev) => {
      return {
        ...prev,
        price: {
          min: value[0] === MIN_PRICE ? '' : value[0].toString(),
          max: value[1] === MAX_PRICE ? '' : value[1].toString(),
        },
      };
      // Remoção da atualização imediata dos parâmetros da URL
    });
  };

  const handleGenderChange = (gender) => {
    expandSection('gender');
    setFilters((prev) => {
      const newGenders = prev.gender.includes(gender)
        ? prev.gender.filter((g) => g !== gender)
        : [...prev.gender, gender];
      return { ...prev, gender: newGenders };
      // Remoção da atualização imediata dos parâmetros da URL
    });
  };

  const handleTagChange = (tag) => {
    expandSection('category');
    setFilters((prev) => {
      const newTags = prev.category.includes(tag)
        ? prev.category.filter((t) => t !== tag)
        : [...prev.category, tag];
      return { ...prev, category: newTags };
      // Remoção da atualização imediata dos parâmetros da URL
    });
  };

  const applyAllFilters = () => {
    // Obter o sortBy atual da URL para preservá-lo
    const currentSortBy = searchParams.get('sortBy') || 'relevance';

    // Aplicar filtros preservando a ordenação atual
    const filtersToApply = {
      ...filters,
      sortBy: currentSortBy,
    };

    // Agora atualizamos a URL e notificamos o componente pai
    updateUrlParams(filtersToApply);
    setOpenState(false);
  };

  const clearAllFilters = () => {
    const resetFilters = {
      brands: [],
      sizes: [],
      colors: [],
      price: { min: '', max: '' },
      gender: [],
      category: [],
      sortBy: searchParams.get('sortBy') || 'relevance', // Manter a ordenação atual
    };
    setFilters(resetFilters);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    updateUrlParams(resetFilters); // Aplicar os filtros resetados imediatamente
  };

  const FilterSection = ({ title, children, section }) => {
    return (
      <div className="border-b border-gray-200 py-4">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() =>
            setExpandedSections((prev) => ({
              ...prev,
              [section]: !prev[section],
            }))
          }
        >
          <h3 className="font-medium">{title}</h3>
          {expandedSections[section] ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>
        {expandedSections[section] && <div className="mt-2">{children}</div>}
      </div>
    );
  };

  // Renderizar apenas o botão de filtro para mobile
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setOpenState(true)}
          className="flex items-center gap-2"
        >
          <FilterIcon size={18} />
          Filtros
          {(filters.brands.length > 0 ||
            filters.sizes.length > 0 ||
            filters.colors.length > 0 ||
            filters.gender.length > 0 || // Atualizado para incluir novos filtros
            filters.category.length > 0 || // Atualizado para incluir novos filtros
            filters.price.min ||
            filters.price.max) && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {filters.brands.length +
                filters.sizes.length +
                filters.colors.length +
                filters.gender.length + // Atualizado para incluir novos filtros
                filters.category.length + // Atualizado para incluir novos filtros
                (filters.price.min || filters.price.max ? 1 : 0)}
            </span>
          )}
        </Button>

        {/* Usar createPortal para renderizar o modal diretamente no body */}
        {openState &&
          portalElement &&
          createPortal(
            <div className="fixed inset-0 bg-black/70 z-[9999]">
              <div className="fixed inset-0 bg-white z-[10000] overflow-auto p-4 max-w-md mx-auto h-full">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b">
                    <h2 className="text-xl font-bold">Filtros</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenState(false)}
                    >
                      <X size={24} />
                    </Button>
                  </div>
                  <div className="flex-grow overflow-y-auto">
                    {/* Nova seção de Gênero */}
                    <FilterSection title="Gênero" section="gender">
                      <div className="flex flex-col space-y-2">
                        {genderOptions.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`gender-mobile-${option.value}`}
                              checked={filters.gender.includes(option.value)}
                              onCheckedChange={() =>
                                handleGenderChange(option.value)
                              }
                            />
                            <Label htmlFor={`gender-mobile-${option.value}`}>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Nova seção de Tags */}
                    <FilterSection title="Categorias" section="category">
                      <div className="flex flex-wrap gap-2">
                        {tagOptions.map((tag) => (
                          <Button
                            key={tag.value}
                            variant={
                              filters.category.includes(tag.value)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="mb-2"
                            onClick={() => handleTagChange(tag.value)}
                          >
                            {tag.label}
                          </Button>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection title="Marca" section="brands">
                      <div className="flex flex-wrap gap-2">
                        {brands.map((brand) => (
                          <Button
                            key={brand}
                            variant={
                              filters.brands.includes(brand)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="mb-2"
                            onClick={() => handleBrandChange(brand)}
                          >
                            {brand}
                          </Button>
                        ))}
                      </div>
                    </FilterSection>
                    <FilterSection title="Tamanho" section="sizes">
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <Button
                            key={size}
                            variant={
                              filters.sizes.includes(size)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="h-10 w-10 rounded-md"
                            onClick={() => handleSizeChange(size)}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </FilterSection>
                    <FilterSection title="Cor" section="colors">
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <Button
                            key={color}
                            variant={
                              filters.colors.includes(color)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="mb-2"
                            onClick={() => handleColorChange(color)}
                          >
                            {color}
                          </Button>
                        ))}
                      </div>
                    </FilterSection>
                    <FilterSection title="Faixa de preço" section="price">
                      <div className="px-1 pb-6 pt-4">
                        <DualRangeSlider
                          value={priceRange}
                          min={MIN_PRICE}
                          max={MAX_PRICE}
                          onValueChange={handlePriceSliderChange}
                          className="mb-4"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            R$ {priceRange[0]}
                          </span>
                          <span className="text-sm text-gray-500">
                            R$
                            {priceRange[1] === MAX_PRICE
                              ? `${MAX_PRICE}+`
                              : priceRange[1]}
                          </span>
                        </div>
                      </div>
                    </FilterSection>
                  </div>
                  <div className="mt-auto pt-4 border-t flex flex-col gap-2">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={applyAllFilters}
                    >
                      <Search size={18} className="mr-1" />
                      Aplicar filtros
                    </Button>
                    {(filters.brands.length > 0 ||
                      filters.sizes.length > 0 ||
                      filters.colors.length > 0 ||
                      filters.gender.length > 0 || // Atualizado para incluir novos filtros
                      filters.category.length > 0 || // Atualizado para incluir novos filtros
                      filters.price.min ||
                      filters.price.max) && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={clearAllFilters}
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            portalElement
          )}
      </>
    );
  }

  // Versão desktop (normal)
  return (
    <div className="h-full flex flex-col">
      <div className="sticky lg:top-4 bg-white p-4 rounded-lg shadow-md h-full flex flex-col border border-gray-100">
        <h2 className="text-xl font-bold mb-2">Filtros</h2>
        <div className="flex-grow overflow-y-auto">
          {/* Nova seção de Gênero */}
          <FilterSection title="Gênero" section="gender">
            <div className="flex flex-col space-y-2">
              {genderOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`gender-desktop-${option.value}`}
                    checked={filters.gender.includes(option.value)}
                    onCheckedChange={() => handleGenderChange(option.value)}
                  />
                  <Label htmlFor={`gender-desktop-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Nova seção de Tags */}
          <FilterSection title="Categorias" section="category">
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <Button
                  key={tag.value}
                  variant={
                    filters.category.includes(tag.value) ? 'default' : 'outline'
                  }
                  size="sm"
                  className="mb-2"
                  onClick={() => handleTagChange(tag.value)}
                >
                  {tag.label}
                </Button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Marca" section="brands">
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Button
                  key={brand}
                  variant={
                    filters.brands.includes(brand) ? 'default' : 'outline'
                  }
                  size="sm"
                  className="mb-2"
                  onClick={() => handleBrandChange(brand)}
                >
                  {brand}
                </Button>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Tamanho" section="sizes">
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Button
                  key={size}
                  variant={filters.sizes.includes(size) ? 'default' : 'outline'}
                  size="sm"
                  className="h-10 w-10 rounded-md"
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Cor" section="colors">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <Button
                  key={color}
                  variant={
                    filters.colors.includes(color) ? 'default' : 'outline'
                  }
                  size="sm"
                  className="mb-2"
                  onClick={() => handleColorChange(color)}
                >
                  {color}
                </Button>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Faixa de preço" section="price">
            <div className="px-1 pb-6 pt-4">
              <DualRangeSlider
                value={priceRange}
                min={MIN_PRICE}
                max={MAX_PRICE}
                onValueChange={handlePriceSliderChange}
                className="mb-4"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  R$ {priceRange[0]}
                </span>
                <span className="text-sm text-gray-500">
                  R$
                  {priceRange[1] === MAX_PRICE
                    ? `${MAX_PRICE}+`
                    : priceRange[1]}
                </span>
              </div>
            </div>
          </FilterSection>
        </div>
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Button
            variant="default"
            className="w-full"
            onClick={applyAllFilters}
          >
            <Search size={18} className="mr-1" />
            Aplicar filtros
          </Button>
          {(filters.brands.length > 0 ||
            filters.sizes.length > 0 ||
            filters.colors.length > 0 ||
            filters.gender.length > 0 || // Atualizado para incluir novos filtros
            filters.category.length > 0 || // Atualizado para incluir novos filtros
            filters.price.min ||
            filters.price.max) && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={clearAllFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filter;
