let pendingRequests = {};

export const getSneakers = async (
  currentPage,
  sneakersPerPage,
  search,
  filters = {}
) => {
  // Usar URLSearchParams para construir os parâmetros de consulta
  const params = new URLSearchParams();

  // Adicionar parâmetros básicos
  if (search) {
    params.set('search', search.toLowerCase());
  }

  if (currentPage) {
    params.set('page', currentPage.toString());
  }

  if (sneakersPerPage) {
    params.set('limit', sneakersPerPage.toString());
  }

  // Adicionar parâmetros de filtro - corrigidos para corresponder ao backend
  if (filters.brands && filters.brands.length > 0) {
    // O backend espera 'brand' no singular
    params.set('brand', filters.brands.join(','));
  }

  if (filters.sizes && filters.sizes.length > 0) {
    // O backend espera 'sizes'
    params.set('sizes', filters.sizes.join(','));
  }

  if (filters.colors && filters.colors.length > 0) {
    params.set('colors', filters.colors.join(','));
  }

  if (filters.gender && filters.gender.length > 0) {
    params.set('gender', filters.gender.join(','));
  }

  if (filters.category && filters.category.length > 0) {
    params.set('category', filters.category.join(','));
  }

  if (filters.price) {
    if (filters.price.min) {
      // Enviar preço mínimo como parâmetro para o backend (sem alteração)
      params.set('minPrice', filters.price.min);
    }
    if (filters.price.max) {
      // Enviar preço máximo como parâmetro para o backend (sem alteração)
      params.set('maxPrice', filters.price.max);
    }
  }

  // Corrigir o envio da ordenação para usar o mapeamento adequado
  if (filters.sortBy && filters.sortBy !== 'relevance') {
    // Usar a função de mapeamento para converter os valores de ordenação
    const mappedSort = mapSortByToBackend(filters.sortBy);
    params.set('sort', mappedSort);
  }

  // Construir a URL
  const url = `${import.meta.env.VITE_API_URL}/sneakers${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  // Implementação de deduplicação de requisições
  const requestKey = url;

  // Se já existe uma requisição pendente com esta mesma URL, retorne a promise existente
  if (pendingRequests[requestKey]) {
    return pendingRequests[requestKey];
  }

  try {
    // Cria a promise da requisição e armazena no objeto de requisições pendentes
    const requestPromise = fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Falha ao buscar tênis: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        return data;
      })
      .finally(() => {
        // Remove esta requisição do objeto de requisições pendentes quando concluída
        delete pendingRequests[requestKey];
      });

    // Armazena a promise para potenciais requisições duplicadas
    pendingRequests[requestKey] = requestPromise;

    return requestPromise;
  } catch (error) {
    console.error('Erro ao buscar tênis:', error);
    // Limpa a requisição pendente em caso de erro
    delete pendingRequests[requestKey];
    throw error;
  }
};

// Função auxiliar para mapear valores de ordenação do frontend para o backend
function mapSortByToBackend(sortBy) {
  switch (sortBy) {
    case 'price_asc':
      return 'basePrice';
    case 'price_desc':
      return '-basePrice';
    case 'newest':
      return '-createdAt';
    case 'popular':
      return '-rating';
    case 'discount_desc':
      return '-baseDiscount';
    default:
      return '-relevance'; // Padrão para relevância
  }
}

export const getSneakerBySlug = async (slug, color) => {
  // Atualização para usar URL base da variável de ambiente e popular variantes/reviews
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/sneakers/${slug}${color ? `?color=${encodeURIComponent(color)}` : ''}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch sneaker details');
  }

  const result = await response.json();
  
  // Os dados reais estão dentro da propriedade 'data'
  const data = result.data || result;
  
  // Log para debug
  console.log("Dados recebidos do backend:", data);
  
  // Se temos colorsInStock, garantir que estejam em minúsculo para comparação consistente
  if (data.colorsInStock && Array.isArray(data.colorsInStock)) {
    // Já está em minúsculo no backend, mas vamos garantir
    data.colorsInStock = data.colorsInStock.map(c => c.toLowerCase());
  }
  
  // O backend já está enviando availableColors como objetos, não precisamos criar

  return data;
};

// Novo método para buscar imagens de uma cor específica
export const getSneakerColorImages = async (sneakerId, color) => {
  const url = `${
    import.meta.env.VITE_API_URL
  }/sneakers/${sneakerId}/color/${color}/images`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Falha ao buscar imagens da cor selecionada');
  }

  return response.json();
};

// Método para verificar disponibilidade de uma cor específica
export const checkColorAvailability = async (sneakerId, color) => {
  const url = `${
    import.meta.env.VITE_API_URL
  }/sneakers/${sneakerId}/variants/availability`;

  const params = color ? `?color=${encodeURIComponent(color)}` : '';

  const response = await fetch(`${url}${params}`);

  if (!response.ok) {
    throw new Error('Falha ao verificar disponibilidade');
  }

  return response.json();
};

export const createSneaker = async (data) => {
  // Atualização para usar URL base da variável de ambiente e o formato correto para enviar sneakers com variantes
  const url = `${import.meta.env.VITE_API_URL}/sneakers`;

  // Organizar os dados no formato esperado pelo backend
  const formattedData = {
    sneakerData: {
      name: data.name,
      price: data.price,
      brand: data.brand,
      description: data.description,
      shortDescription:
        data.shortDescription || data.description.substring(0, 150),
      images: data.images || [{ url: data.image, isPrimary: true }],
      sizes: data.sizes,
      colors: data.colors,
      gender: data.gender || 'unisex',
      category: data.category,
      tags: data.tags,
      discount: data.discount || 0,
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
    },
    // Transformar tamanhos e cores em variantes se não forem fornecidas diretamente
    variants: data.variants || generateVariantsFromSizesAndColors(data),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create sneaker');
  }

  return response.json();
};

// Função de utilitário para gerar variantes baseadas em tamanhos e cores
function generateVariantsFromSizesAndColors(data) {
  if (
    !data.sizes ||
    !data.colors ||
    !Array.isArray(data.sizes) ||
    !Array.isArray(data.colors)
  ) {
    return [];
  }

  const variants = [];
  for (const size of data.sizes) {
    for (const color of data.colors) {
      variants.push({
        size: size,
        color: color,
        stock: data.initialStock || 0,
        price: data.price, // Preço padrão do tênis
      });
    }
  }

  return variants;
}

export const updateSneaker = async (id, data) => {
  const url = `${import.meta.env.VITE_API_URL}/sneakers/${id}`;

  // Organizar os dados no mesmo formato de criação
  const formattedData = {
    sneakerData: {
      name: data.name,
      price: data.price,
      brand: data.brand,
      description: data.description,
      shortDescription:
        data.shortDescription || data.description?.substring(0, 150),
      images: data.images || [{ url: data.image, isPrimary: true }],
      sizes: data.sizes,
      colors: data.colors,
      gender: data.gender || 'unisex',
      category: data.category,
      tags: data.tags,
      discount: data.discount || 0,
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
    },
    variants: data.variants || generateVariantsFromSizesAndColors(data),
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update sneaker');
  }

  return response.json();
};

export const deleteSneaker = async (id) => {
  const url = `${import.meta.env.VITE_API_URL}/sneakers/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete sneaker');
  }

  return response.json();
};

export const getRelatedSneakers = async (id) => {
  const response = await fetch(`/sneakers/${id}/related`);

  if (!response.ok) {
    throw new Error('Failed to fetch related sneakers');
  }

  return response.json();
};

// Novo método para obter variantes de um tênis específico
export const getSneakerVariants = async (sneakerId) => {
  const url = `${import.meta.env.VITE_API_URL}/sneakers/${sneakerId}/variants`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch variants');
  }

  return response.json();
};

// Novo método para atualizar o estoque de uma variante
export const updateVariantStock = async (variantId, stock) => {
  const url = `${
    import.meta.env.VITE_API_URL
  }/sneakers/variants/${variantId}/stock`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stock }),
  });

  if (!response.ok) {
    throw new Error('Failed to update variant stock');
  }

  return response.json();
};
