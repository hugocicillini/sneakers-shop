import LayoutBase from '@/layout/LayoutBase';
import { getSneakers } from '@/services/sneakers.service'; // Assumindo que existe um serviço de pesquisa
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SearchFound = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Efeito para obter o termo de pesquisa e realizar a busca
  useEffect(() => {
    // Obtém o valor de pesquisa do URLSearchParams ou query string
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q') || '';

    setSearchTerm(query);

    // Se tiver um termo de pesquisa, realizar a busca
    if (query) {
      setLoading(true);

      // Função para buscar resultados usando getSneakers com o termo de pesquisa
      const fetchResults = async () => {
        try {
          // Passar o termo de pesquisa como terceiro parâmetro do getSneakers
          // currentPage = 1, sneakersPerPage = 20, search = query
          const response = await getSneakers(1, 20, query);

          // Verificar se a resposta tem o formato esperado (com a chave sneakers)
          const data = response.sneakers || response.data || response || [];

          console.log('Resultados da pesquisa:', data);
          setResults(data);
        } catch (error) {
          console.error('Erro ao buscar resultados:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      fetchResults();
    } else {
      setResults([]);
    }
  }, [location.search]);

  // Função para renderizar os resultados com cards mais completos
  const renderResults = () => {
    if (loading) {
      return (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!searchTerm) {
      return (
        <div className="text-center my-12">
          <p className="text-gray-600 text-lg">Digite algo para pesquisar</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="text-center my-12">
          <p className="text-gray-600 text-lg">
            Nenhum resultado encontrado para "{searchTerm}"
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((sneaker) => (
          <div
            key={sneaker._id}
            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            {/* Link para a página do produto */}
            <a href={`/sneaker/${sneaker.slug}`} className="block">
              {/* Imagem do Produto */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={sneaker.coverImage?.url || '/placeholder-product.png'}
                  alt={sneaker.coverImage?.alt || sneaker.name}
                  className="object-cover w-full h-full"
                />
                {/* Badge de desconto */}
                {sneaker.baseDiscount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {sneaker.baseDiscount}% OFF
                  </div>
                )}
              </div>

              {/* Informações do Produto */}
              <div className="p-4">
                {/* Marca com Logo */}
                <div className="flex items-center mb-2 max-w-6">
                  {sneaker.brand?.logo && (
                    <img
                      src={sneaker.brand.logo}
                      alt={sneaker.brand.name}
                      className="h-5 w-auto mr-2 object-contain"
                    />
                  )}
                  <span className="text-sm text-gray-600 font-medium">
                    {sneaker.brand?.name}
                  </span>
                </div>

                {/* Nome do Produto */}
                <h3 className="font-medium text-gray-800 text-base truncate mb-1">
                  {sneaker.name}
                </h3>

                {/* Categoria e Cor */}
                <div className="mb-2 flex flex-wrap">
                  {sneaker.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                      {sneaker.category.name}
                    </span>
                  )}
                  {sneaker.defaultColor && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mb-1">
                      {sneaker.defaultColor}
                    </span>
                  )}
                </div>

                {/* Avaliações */}
                <div className="flex items-center mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill={
                          i < Math.floor(sneaker.rating) ? '#FFD700' : '#E5E7EB'
                        }
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 ml-1">
                    {sneaker.rating} ({sneaker.reviewCount || 0})
                  </span>
                </div>

                {/* Preço */}
                <div className="flex items-center justify-between">
                  <div>
                    {sneaker.baseDiscount > 0 ? (
                      <>
                        <span className="text-lg font-bold text-gray-900">
                          R$ {sneaker.finalPrice?.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          R$ {sneaker.basePrice?.toFixed(2).replace('.', ',')}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        R$ {sneaker.finalPrice?.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <LayoutBase search={searchTerm} setSearch={setSearchTerm}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">
          {searchTerm ? `Resultados para "${searchTerm}"` : 'Pesquisa'}
        </h1>

        <p className="text-gray-600 mb-6">
          {results.length}{' '}
          {results.length === 1
            ? 'resultado encontrado'
            : 'resultados encontrados'}
        </p>

        {renderResults()}
      </div>
    </LayoutBase>
  );
};

export default SearchFound;
