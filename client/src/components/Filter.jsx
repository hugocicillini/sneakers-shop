import {
  ChevronDown,
  ChevronUp,
  Filter as FilterIcon,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  // Usar o estado fornecido por props ou o interno
  const openState = setIsOpen ? isOpen : internalIsOpen;
  const setOpenState = setIsOpen || setInternalIsOpen;

  const [filters, setFilters] = useState({
    brands: [],
    sizes: [],
    colors: [],
    price: { min: '', max: '' },
    gender: [], // Novo: filtro de gênero
    tags: [], // Novo: filtro de tags
    sortBy: 'relevance', // Define o valor padrão ao iniciar o componente
  });
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [expandedSections, setExpandedSections] = useState({
    brands: false,
    sizes: false,
    colors: false,
    price: false,
    gender: false, // Novo: estado para seção de gênero
    tags: false, // Novo: estado para seção de tags
  });

  // Element para portal
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    // Configurar o elemento para o portal apenas uma vez
    setPortalElement(document.body);
  }, []);

  const MIN_PRICE = 0;
  const MAX_PRICE = 1000;

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
    });
  };

  const handleSizeChange = (size) => {
    expandSection('sizes');
    setFilters((prev) => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: newSizes };
    });
  };

  const handleColorChange = (color) => {
    expandSection('colors');
    setFilters((prev) => {
      const newColors = prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors: newColors };
    });
  };

  const handlePriceSliderChange = (value) => {
    expandSection('price');
    setPriceRange(value);
    setFilters((prev) => ({
      ...prev,
      price: {
        min: value[0] === MIN_PRICE ? '' : value[0].toString(),
        max: value[1] === MAX_PRICE ? '' : value[1].toString(),
      },
    }));
  };

  // Handlers para novos filtros
  const handleGenderChange = (gender) => {
    expandSection('gender');
    setFilters((prev) => {
      const newGenders = prev.gender.includes(gender)
        ? prev.gender.filter((g) => g !== gender)
        : [...prev.gender, gender];
      return { ...prev, gender: newGenders };
    });
  };

  const handleTagChange = (tag) => {
    expandSection('tags');
    setFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const applyAllFilters = () => {
    onFilterChange && onFilterChange(filters);
    setOpenState(false);
  };

  const clearAllFilters = () => {
    const resetFilters = {
      brands: [],
      sizes: [],
      colors: [],
      price: { min: '', max: '' },
      gender: [], // Limpar filtros de gênero
      tags: [], // Limpar filtros de tags
      sortBy: 'relevance', // Adicionar isso para garantir que a ordenação volte para o padrão
    };
    setFilters(resetFilters);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    onFilterChange && onFilterChange(resetFilters);
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
            filters.tags.length > 0 || // Atualizado para incluir novos filtros
            filters.price.min ||
            filters.price.max) && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {filters.brands.length +
                filters.sizes.length +
                filters.colors.length +
                filters.gender.length + // Atualizado para incluir novos filtros
                filters.tags.length + // Atualizado para incluir novos filtros
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
                    <FilterSection title="Categorias" section="tags">
                      <div className="flex flex-wrap gap-2">
                        {tagOptions.map((tag) => (
                          <Button
                            key={tag.value}
                            variant={
                              filters.tags.includes(tag.value)
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
                      filters.tags.length > 0 || // Atualizado para incluir novos filtros
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
          <FilterSection title="Categorias" section="tags">
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <Button
                  key={tag.value}
                  variant={
                    filters.tags.includes(tag.value) ? 'default' : 'outline'
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
            filters.tags.length > 0 || // Atualizado para incluir novos filtros
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
