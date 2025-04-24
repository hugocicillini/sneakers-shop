import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import {
  CircleUserRound,
  Heart,
  LogOut,
  Menu,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Search from '../components/Search';

const LayoutBase = ({ children, search, setSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Substituído o useContext por useAuth para acessar as funções de autenticação
  const { user, logout } = useAuth();

  const { favorites } = useFavorites();

  // Calcular número de favoritos - garantir que sempre seja um número
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0;

  // Verificar tamanho da tela para determinar se é mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Verificar ao carregar
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fechar o menu quando mudar de tela mobile para desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <div>
      <header className="bg-[#f7f7f7] py-4 md:py-6 px-4 shadow">
        <div className="flex items-center justify-between md:justify-around">
          {/* Botão do Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center justify-center"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex">
            <Search search={search} setSearch={setSearch} />
          </div>

          {/* Logo Centralizado */}
          <div className="flex items-center justify-center">
            <Link to="/" className="font-bold text-lg">
              <img src="/logo.png" alt="Logo" className="h-16" />
            </Link>
          </div>

          {/* Ícones à direita em mobile, Menu completo em desktop */}
          <div className="flex md:hidden items-center gap-3">
            <div className="relative">
              <Link to="/favorites">
                <Heart size={24} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {favoritesCount}
                </span>
              </Link>
            </div>
            <div className="relative">
              <Link to="/cart">
                <ShoppingBag size={24} />
                <span className="absolute -top-2 -right-2 bg-black text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  1
                </span>
              </Link>
            </div>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/account" className="flex items-center gap-1">
                  <Button variant="ghost" className="flex gap-2 items-center">
                    <CircleUserRound />
                    <span className="text-sm">
                      Olá, {user.name.split(' ')[0]}
                    </span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Sair"
                  className="text-gray-600 hover:text-red-500"
                >
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="flex gap-1 items-center">
                    <CircleUserRound size={18} />
                    <span className="text-sm">Entrar</span>
                  </Button>
                </Link>
                <span>|</span>
                <Link to="/register">
                  <Button variant="ghost">
                    <span className="text-sm">Cadastrar</span>
                  </Button>
                </Link>
              </div>
            )}
            <Link to="/favorites" className="flex items-center gap-1 relative">
              <Button variant="outline">
                <Heart />
                Favoritos
                {favoritesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                    {favoritesCount}
                  </span>
                )}{' '}
              </Button>
            </Link>
            <Link to="/cart" className="flex items-center gap-1 relative">
              <Button variant="outline">
                <ShoppingBag />
                Carrinho
                <span className="absolute -top-2 -right-2 bg-black text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  1
                </span>
              </Button>
            </Link>
          </nav>
        </div>

        {/* Campo de Busca abaixo do header em mobile */}
        <div className="mt-4 mx-auto max-w-md md:hidden">
          <Search search={search} setSearch={setSearch} />
        </div>
      </header>

      {/* Menu Mobile deslizando da esquerda */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 z-50 bg-white transition-transform duration-300 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-end">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-black"
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex flex-col items-start py-4">
          <Link
            to="/"
            className="w-full px-8 py-3 text-black"
            onClick={() => setIsMenuOpen(false)}
          >
            Início
          </Link>

          {user ? (
            <>
              <Link
                to="/account"
                className="w-full px-8 py-3 text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Minha Conta
              </Link>
              <Button
                className="w-full px-8 py-3 text-left text-red-600"
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="w-full px-8 py-3 text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="w-full px-8 py-3 text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Cadastrar
              </Link>
            </>
          )}
          <Link
            to="/favorites"
            className="w-full px-8 py-3 text-black"
            onClick={() => setIsMenuOpen(false)}
          >
            Favoritos
          </Link>
          <Link
            to="/cart"
            className="w-full px-8 py-3 text-black"
            onClick={() => setIsMenuOpen(false)}
          >
            Carrinho
          </Link>
        </nav>
      </div>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      <main className="min-h-screen">{children}</main>
    </div>
  );
};

export default LayoutBase;
