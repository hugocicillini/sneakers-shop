import { useState } from 'react';
import LayoutBase from '@/layout/LayoutBase';
import Sneakers from '@/components/Sneakers';

const Home = () => {
  const [search, setSearch] = useState('');

  return (
    <LayoutBase search={search} setSearch={setSearch}>
      <Sneakers search={search} />
    </LayoutBase>
  );
};

export default Home;
