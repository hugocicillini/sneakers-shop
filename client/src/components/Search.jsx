import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const Search = ({ search, setSearch }) => {
  const [inputValue, setInputValue] = useState(search || '');

  useEffect(() => {
    setInputValue(search || '');
  }, [search]);

  const handleSearch = () => {
    setSearch(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearch(inputValue);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSearch('');
  };

  return (
    <div className="relative flex items-center w-full sm:w-[300px]">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar..."
        className="pr-10 bg-white"
      />

      {inputValue ? (
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
