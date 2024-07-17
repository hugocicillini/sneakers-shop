import Tenis from './components/Tenis';
import Search from './components/Search';
import axios from 'axios';
import { useState, useEffect } from 'react';

function App() {
  const [tenis, setTenis] = useState([]);

  useEffect(() => {
    fetchTenis("todos");
  }, []);

  const fetchTenis = (query) => {
    let url = "http://localhost:5000/tenis";
    if (query !== "todos") {
      url += `?search=${query.toLowerCase()}`;
    }
    axios.get(url)
      .then((response) => {
        console.log(response.data.data);
        setTenis(response.data.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
        setTenis([]);
      });
  };

  return (
    <>
      <Search fetchTenis={fetchTenis} />
      <Tenis tenis={tenis} fetchTenis={fetchTenis} />
    </>
  );
}

export default App;
