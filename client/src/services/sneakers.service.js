export const getSneakers = async (
  currentPage,
  sneakersPerPage,
  search,
  filters = {}
) => {
  let url = `${import.meta.env.VITE_API_URL}/api/sneakers`;

  const params = [];

  if (search) {
    params.push(`search=${encodeURIComponent(search.toLowerCase())}`);
  }

  if (currentPage) {
    params.push(`page=${currentPage}`);
  }
  if (sneakersPerPage) {
    params.push(`limit=${sneakersPerPage}`);
  }

  if (filters.brand || (filters.brands && filters.brands.length > 0)) {
    const brand =
      filters.brand || (filters.brands.length === 1 ? filters.brands[0] : null);
    if (brand) {
      params.push(`brand=${encodeURIComponent(brand)}`);
    }
  }

  if (filters.sizes && filters.sizes.length > 0) {
    params.push(`sizes=${filters.sizes.join(',')}`);
  }

  if (filters.colors && filters.colors.length > 0) {
    params.push(`colors=${filters.colors.join(',')}`);
  }

  // Novo: suporte para filtro de gênero
  if (filters.gender && filters.gender.length > 0) {
    params.push(`gender=${filters.gender.join(',')}`);
  }

  // Novo: suporte para filtro de tags/categorias
  if (filters.tags && filters.tags.length > 0) {
    params.push(`tags=${filters.tags.join(',')}`);
  }

  if (filters.price) {
    if (filters.price.min !== undefined && filters.price.min !== '') {
      const minPrice = parseFloat(filters.price.min);
      if (!isNaN(minPrice)) {
        params.push(`minPrice=${minPrice}`);
      }
    }
    if (filters.price.max !== undefined && filters.price.max !== '') {
      const maxPrice = parseFloat(filters.price.max);
      if (!isNaN(maxPrice)) {
        params.push(`maxPrice=${maxPrice}`);
      }
    }
  }

  // Adicionar suporte para ordenação
  if (filters.sortBy) {
    params.push(`sortBy=${filters.sortBy}`);
  }

  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Falha ao buscar tênis');
  }

  return response.json();
};

export const getSneakerBySlug = async (slug) => {
  // Atualização para usar URL base da variável de ambiente e popular variantes/reviews
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/sneakers/${slug}`,
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

  const data = await response.json();

  // Verifica se há variantes disponíveis e obtém a primeira cor em estoque
  if (
    data.variants &&
    Array.isArray(data.variants) &&
    data.variants.length > 0
  ) {
    // Filtra as variantes com estoque > 0 e agrupa por cor
    const availableColors = {};
    data.variants.forEach((variant) => {
      if (variant.stock > 0 && variant.isActive) {
        if (!availableColors[variant.color]) {
          availableColors[variant.color] = true;
        }
      }
    });

    const availableColorsList = Object.keys(availableColors);

    // Verifica se a cor padrão do produto tem estoque disponível
    if (data.defaultColor && availableColors[data.defaultColor]) {
      // Mantém a cor padrão do produto se estiver disponível
    } else if (availableColorsList.length > 0) {
      // Se não tiver cor padrão ou ela não estiver disponível, usa a primeira cor com estoque
      data.defaultColor = availableColorsList[0];
    }

    // Busca imagens da cor padrão
    if (data.defaultColor) {
      const colorImageSet = data.colorImages?.find(
        (item) => item.color.toLowerCase() === data.defaultColor.toLowerCase()
      );

      // Se houver imagens para a cor padrão, já as disponibiliza
      if (colorImageSet && colorImageSet.images.length > 0) {
        data.currentColorImages = colorImageSet.images;
      }
    }

    // Adiciona lista de cores disponíveis
    data.availableColors = availableColorsList;
  }

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
  const response = await fetch(`/api/sneakers/${id}/related`);

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
