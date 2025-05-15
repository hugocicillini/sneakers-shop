export const getSneakerReviews = async (sneakerId, options = {}) => {
  const { page = 1, limit = 10, sort = 'recent' } = options;

  const queryParams = new URLSearchParams({
    page,
    limit,
    sort,
  }).toString();

  const response = await fetch(
    `${
      import.meta.env.VITE_API_URL
    }/reviews/sneaker/${sneakerId}?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) {
    throw new Error('Erro ao obter reviews do sneaker');
  }
  const data = await response.json();

  return data;
};
