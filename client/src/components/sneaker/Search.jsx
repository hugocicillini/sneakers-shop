import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Search = () => {
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearch(query);
  }, [searchParams]);

  const handleSearch = useCallback(() => {
    if (!search.trim()) return;

    const query = search.trim();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }, [search, navigate]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }

      if (e.key === 'Escape') {
        setSearch('');
      }
    },
    [handleSearch]
  );

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <div className="relative flex items-center w-full sm:w-[300px]">
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar..."
        className="pr-10 bg-white"
      />

      {search ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={clearSearch}
          className="absolute right-8 hover:bg-transparent top-1/2 -translate-y-1/2"
          aria-label="Limpar pesquisa"
        >
          <XIcon size={16} />
        </Button>
      ) : null}

      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleSearch}
        className="absolute right-1 hover:bg-transparent top-1/2 -translate-y-1/2"
        aria-label="Buscar"
      >
        <SearchIcon size={20} />
      </Button>
    </div>
  );
};

export default Search;
