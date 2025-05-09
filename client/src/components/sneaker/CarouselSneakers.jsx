import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getSneakers } from '@/services/sneakers.service';
import { StarFilledIcon } from '@radix-ui/react-icons';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CarouselSneakers = ({
  sneakers,
  title = 'Tênis relacionados',
  emptyMessage = 'Não há tênis relacionados para este produto.',
}) => {
  const [sneakersData, setSneakersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Configuração do carrossel Embla com opções específicas
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    },
    dragFree: true,
    loop: false,
  });

  // Função para formatar preços
  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Funções de navegação do carrossel
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  // Atualiza o estado com base na posição do carrossel
  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Inicializa o carrossel e configura os listeners
  useEffect(() => {
    if (!emblaApi) return;

    // Captura todos os pontos de parada do carrossel
    setScrollSnaps(emblaApi.scrollSnapList());

    // Configura os listeners para eventos do carrossel
    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Carrega os dados dos tênis
  useEffect(() => {
    const areOnlyIds = sneakers.length > 0 && typeof sneakers[0] === 'string';

    const fetchSneakersData = async () => {
      if (areOnlyIds) {
        try {
          setLoading(true);
          const ids = sneakers.join(',');
          const response = await getSneakers({
            ids: ids,
            limit: sneakers.length,
          });

          if (response && response.data) {
            setSneakersData(response.data);
          }
        } catch (error) {
          console.error('Erro ao buscar tênis relacionados:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSneakersData(sneakers);
        setLoading(false);
      }
    };

    if (sneakers && sneakers.length > 0) {
      fetchSneakersData();
    } else {
      setLoading(false);
    }
  }, [sneakers]);

  // Renderização condicional para estados de carregamento
  if (loading) {
    return <div className="py-8 text-center">Carregando tênis...</div>;
  }

  if (!sneakersData || sneakersData.length === 0) {
    return <p className="text-gray-500 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="select-none">
      {/* Cabeçalho com título e botões de navegação */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="rounded-full transition-opacity"
            style={{ opacity: prevBtnEnabled ? 1 : 0.5 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="rounded-full transition-opacity"
            style={{ opacity: nextBtnEnabled ? 1 : 0.5 }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Container do carrossel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {sneakersData.map((sneaker) => (
              <div
                key={sneaker._id}
                className="flex-shrink-0 pl-0 pr-4 pb-6 w-[85%] sm:w-[45%] md:w-[calc(100%/3)] lg:w-[25%] xl:w-[20%] min-w-0"
              >
                <Link to={`/sneaker/${sneaker.slug}`}>
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                    <div className="relative h-[200px] overflow-hidden bg-gray-50">
                      <img
                        src={
                          (sneaker.coverImage && sneaker.coverImage.url) ||
                          '/placeholder-image.jpg'
                        }
                        alt={sneaker.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                      {sneaker.baseDiscount > 0 && (
                        <Badge
                          className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5"
                          variant="destructive"
                        >
                          -{sneaker.baseDiscount}%
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm font-medium line-clamp-2 h-10">
                        {sneaker.name}
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        {sneaker.brand?.name}
                      </p>
                    </CardHeader>
                    <CardFooter className="p-3 pt-0 flex justify-between items-center">
                      <div className="flex flex-col">
                        {sneaker.baseDiscount > 0 ? (
                          <>
                            <div className="flex items-center">
                              <span className="font-semibold text-primary">
                                R$ {formatPrice(sneaker.finalPrice)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 line-through">
                              R$ {formatPrice(sneaker.basePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-primary">
                            R$ {formatPrice(sneaker.basePrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-gray-50 px-1.5 py-0.5 rounded">
                        <StarFilledIcon className="h-3 w-3 text-yellow-500 mr-0.5" />
                        <span className="text-xs font-medium">
                          {sneaker.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de navegação sobrepostos para dispositivos móveis */}
        <div className="absolute top-1/2 -left-3 transform -translate-y-1/2 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="rounded-full bg-white shadow-md w-8 h-8"
            style={{ opacity: prevBtnEnabled ? 1 : 0 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="rounded-full bg-white shadow-md w-8 h-8"
            style={{ opacity: nextBtnEnabled ? 1 : 0 }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bullets de navegação */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                selectedIndex === index
                  ? 'bg-primary w-6'
                  : 'bg-gray-300 w-2 hover:bg-gray-400'
              }`}
              aria-label={`Ir para página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselSneakers;
