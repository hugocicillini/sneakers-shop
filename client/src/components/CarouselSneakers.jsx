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
  cardWidth = 250,
}) => {
  const [sneakersData, setSneakersData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para os botões de navegação
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  // Estados para o indicador de progresso
  const [scrollProgress, setScrollProgress] = useState(0);

  // Inicializa o carrossel Embla com configurações melhoradas
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1, // Avançar 2 slides por vez ao clicar nos botões
    dragFree: false, // Desativa o scroll livre para maior controle
    speed: 10, // Aumenta a velocidade de animação (valor menor = mais rápido)
    loop: false, // Não fazer loop no carrossel
  });

  // Callbacks para controle do carrossel
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Atualiza o estado dos botões e o progresso quando o carrossel muda
  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    // Atualiza os estados dos botões
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());

    // Cálculo melhorado do progresso de navegação
    // Baseado na posição do slide atual em relação ao total de slides
    const currentIndex = emblaApi.selectedScrollSnap();
    const totalSlides = emblaApi.scrollSnapList().length - 1; // -1 porque é baseado em índice

    // Calcula progresso baseado no índice atual / total (evita o problema no final)
    const calculatedProgress =
      totalSlides > 0 ? (currentIndex / totalSlides) * 100 : 100;
    setScrollProgress(calculatedProgress);
  }, [emblaApi]);

  // Efeito para configurar o carrossel
  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    emblaApi.on('scroll', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('scroll', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    // Verifica se os sneakers são apenas IDs (strings) ou objetos completos
    const areOnlyIds = sneakers.length > 0 && typeof sneakers[0] === 'string';

    const fetchSneakersData = async () => {
      if (areOnlyIds) {
        try {
          setLoading(true);
          // Constrói a query para buscar múltiplos IDs
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
        // Já são objetos completos
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

  if (loading) {
    return <div className="py-8 text-center">Carregando tênis...</div>;
  }

  if (!sneakersData || sneakersData.length === 0) {
    return <p className="text-gray-500 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div>
      {/* Cabeçalho com título e controles de navegação */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="hidden md:flex gap-2">
          <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
          <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
        </div>
      </div>

      {/* Carrossel com classe adicional para melhor controle */}
      <div className="overflow-hidden embla-container" ref={emblaRef}>
        <div className="flex">
          {sneakersData.map((sneaker) => (
            <div
              key={sneaker._id}
              className="flex-shrink-0 pl-0 mr-4"
              style={{
                flex: `0 0 ${cardWidth}px`,
                minWidth: 0,
              }}
            >
              <Link to={`/sneaker/${sneaker.slug}`}>
                <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="relative h-[150px] overflow-hidden bg-gray-100">
                    <img
                      src={
                        (sneaker.coverImage && sneaker.coverImage.url) ||
                        '/placeholder-image.jpg'
                      }
                      alt={sneaker.name}
                      className="object-cover w-full h-full"
                    />
                    {/* Usar baseDiscount em vez de discount */}
                    {sneaker.baseDiscount > 0 && (
                      <Badge
                        className="absolute top-2 right-2 bg-red-500"
                        variant="destructive"
                      >
                        -{sneaker.baseDiscount}%
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {sneaker.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      {/* Verificar se brand é um objeto ou um ID */}
                      {sneaker.brand.name}
                    </p>
                  </CardHeader>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <div className="flex flex-col">
                      {/* Usar baseDiscount e basePrice em vez de discount e price */}
                      {sneaker.baseDiscount > 0 ? (
                        <>
                          <span className="font-semibold text-primary">
                            R${' '}
                            {sneaker.finalPrice ||
                              (
                                sneaker.basePrice *
                                (1 - sneaker.baseDiscount / 100)
                              ).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            R$ {sneaker.basePrice?.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-primary">
                          R$ {sneaker.basePrice?.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <StarFilledIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-xs">
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

      {/* Barra de progresso - visível apenas em telas pequenas */}
      <div className="w-full mt-4 bg-gray-200 rounded-full h-1 md:hidden">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Controles de navegação em telas menores */}
      <div className="md:hidden flex justify-center gap-2 mt-4">
        <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
        <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
      </div>
    </div>
  );
};

// Componentes para os botões de navegação
const PrevButton = ({ onClick, enabled }) => (
  <Button
    variant="outline"
    size="icon"
    onClick={onClick}
    disabled={!enabled}
    className="rounded-full transition-opacity"
    style={{ opacity: enabled ? 1 : 0.5 }}
  >
    <ChevronLeft className="h-4 w-4" />
  </Button>
);

const NextButton = ({ onClick, enabled }) => (
  <Button
    variant="outline"
    size="icon"
    onClick={onClick}
    disabled={!enabled}
    className="rounded-full transition-opacity"
    style={{ opacity: enabled ? 1 : 0.5 }}
  >
    <ChevronRight className="h-4 w-4" />
  </Button>
);

export default CarouselSneakers;
