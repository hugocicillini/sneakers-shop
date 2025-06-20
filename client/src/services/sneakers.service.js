let pendingRequests = {};

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
      return '-relevance';
  }
}

export const getSneakers = async (
  currentPage,
  sneakersPerPage,
  search,
  filters = {}
) => {
  const params = new URLSearchParams();

  if (search) {
    params.set('search', search.toLowerCase());
  }

  if (currentPage) {
    params.set('page', currentPage.toString());
  }

  if (sneakersPerPage) {
    params.set('limit', sneakersPerPage.toString());
  }

  if (filters.brands && filters.brands.length > 0) {
    params.set('brand', filters.brands.join(','));
  }

  if (filters.sizes && filters.sizes.length > 0) {
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
      params.set('minPrice', filters.price.min);
    }
    if (filters.price.max) {
      params.set('maxPrice', filters.price.max);
    }
  }

  if (filters.sortBy && filters.sortBy !== 'relevance') {
    const mappedSort = mapSortByToBackend(filters.sortBy);
    params.set('sort', mappedSort);
  }

  const url = `${import.meta.env.VITE_API_URL}/sneakers${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const requestKey = url;

  if (pendingRequests[requestKey]) {
    return pendingRequests[requestKey];
  }

  try {
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
        delete pendingRequests[requestKey];
      });

    pendingRequests[requestKey] = requestPromise;

    return requestPromise;
  } catch (error) {
    console.error('Erro ao buscar tênis:', error);
    delete pendingRequests[requestKey];
    throw error;
  }
};

export const getSneakerBySlug = async (slug, color) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/sneakers/${slug}${
      color ? `?color=${encodeURIComponent(color)}` : ''
    }`,
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

  const data = result.data || result;

  if (data.colorsInStock && Array.isArray(data.colorsInStock)) {
    data.colorsInStock = data.colorsInStock.map((c) => c.toLowerCase());
  }

  return data;
};
