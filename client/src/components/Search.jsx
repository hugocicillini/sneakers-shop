import { useState } from 'react';
import { Input } from './ui/input';

const Search = ({ fetchTenis }) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchTenis(value);
  };

  return (
    <div className='mt-8 mx-8 flex justify-center items-center'>
      <Input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Pesquisar..."
        className="w-full sm:w-[300px]"
      />
    </div>
  );
};

export default Search;
