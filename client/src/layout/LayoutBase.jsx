import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import Footer from '@/layout/Footer';
import {
  CircleUserRound,
  Heart,
  LogOut,
  Menu,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Search from '../components/sneaker/Search';

const LayoutBase = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const location = useLocation();

  // Detectar mudanças de tela de forma otimizada
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Fechar menu automaticamente em desktop
      if (!mobile) {
        setIsMenuOpen(false);
      }
    };

    // Definir estado inicial
    handleResize();

    // Listener otimizado com debounce
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Fechar menu ao navegar para nova página
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevenir scroll do body quando menu estiver aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup ao desmontar componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    closeMenu();
  }, [logout, closeMenu]);

  // 🎯 Extrair o nome corretamente da estrutura { user: { user: { name: "Hugo Cliente" } } }
  const userName = useMemo(() => {
    // Estrutura correta baseada no JSON fornecido
    const fullName = user?.user?.name || '';

    if (!fullName) return '';

    // Extrair apenas o primeiro nome
    const firstName = fullName.split(' ')[0];
    return firstName;
  }, [user]);

  // 🎯 Verificar se o usuário está logado
  const isLoggedIn = useMemo(() => {
    return !!user?.user?.name;
  }, [user]);

  // Componente BadgeCount reutilizável
  const BadgeCount = ({ count, bgColor = 'bg-red-500' }) => {
    if (count <= 0) return null;

    return (
      <span
        className={`absolute -top-2 -right-2 ${bgColor} text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium`}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Componente UserMenu para desktop
  const UserMenu = () => {
    if (isLoggedIn) {
      return (
        <div className="flex items-center gap-2">
          <Link to="/account" className="flex items-center gap-1">
            <Button variant="ghost" className="flex gap-2 items-center">
              <CircleUserRound size={18} />
              <span className="text-sm">Olá, {userName || 'Usuário'}</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sair"
            className="text-gray-600 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="ghost" className="flex gap-1 items-center">
            <CircleUserRound size={18} />
            <span className="text-sm">Entrar</span>
          </Button>
        </Link>
        <span className="text-gray-300">|</span>
        <Link to="/register">
          <Button variant="ghost">
            <span className="text-sm">Cadastrar</span>
          </Button>
        </Link>
      </div>
    );
  };

  // Componente ActionButtons para carrinho e wishlist
  const ActionButtons = ({ showLabels = true }) => (
    <>
      <Link to="/wishlist" className="flex items-center gap-1 relative">
        <Button variant="outline" className="relative">
          <Heart size={18} />
          {showLabels && <span className="ml-1">Favoritos</span>}
          <BadgeCount count={wishlistCount} />
        </Button>
      </Link>
      <Link to="/checkout/cart" className="flex items-center gap-1 relative">
        <Button variant="outline" className="relative">
          <ShoppingBag size={18} />
          {showLabels && <span className="ml-1">Carrinho</span>}
          <BadgeCount count={cartCount} bgColor="bg-black" />
        </Button>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
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
            <Search />
          </div>

          {/* Logo Centralizado */}
          <div className="flex items-center justify-center">
            <Link
              to="/"
              className="font-bold text-lg focus:outline-none focus:ring-0 rounded"
            >
              <img src="/logo.png" alt="Logo" className="h-16" />
            </Link>
          </div>

          {/* Ícones à direita em mobile, Menu completo em desktop */}
          <div className="flex md:hidden items-center gap-3">
            <div className="relative">
              <Link to="/wishlist">
                <Heart size={24} />
                <BadgeCount count={wishlistCount} />
              </Link>
            </div>
            <div className="relative">
              <Link to="/checkout/cart">
                <ShoppingBag size={24} />
                <BadgeCount count={cartCount} bgColor="bg-black" />
              </Link>
            </div>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <UserMenu />
            <ActionButtons />
          </nav>
        </div>

        {/* Campo de Busca Mobile */}
        <div className="mt-4 mx-auto max-w-md md:hidden">
          <Search />
        </div>
      </header>

      {/* Menu Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 bg-white shadow-2xl transition-transform duration-300 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isMenuOpen}
      >
        {/* Header do Menu */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {isLoggedIn ? `Olá, ${userName}!` : 'Menu'}
          </h2>
          <button
            onClick={closeMenu}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col py-4" role="navigation">
          <Link
            to="/"
            className="w-full px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3"
            onClick={closeMenu}
          >
            <span>Início</span>
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                to="/account"
                className="w-full px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3"
                onClick={closeMenu}
              >
                <CircleUserRound size={18} />
                <span>Minha Conta</span>
              </Link>
              <button
                className="w-full px-6 py-4 text-left text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100 flex items-center gap-3"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="w-full px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3"
                onClick={closeMenu}
              >
                <CircleUserRound size={18} />
                <span>Entrar</span>
              </Link>
              <Link
                to="/register"
                className="w-full px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={closeMenu}
              >
                <span>Cadastrar</span>
              </Link>
            </>
          )}

          <Link
            to="/wishlist"
            className="w-full px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center justify-between"
            onClick={closeMenu}
          >
            <div className="flex items-center gap-3">
              <Heart size={18} />
              <span>Favoritos</span>
            </div>
            {wishlistCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/checkout/cart"
            className="w-full px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between"
            onClick={closeMenu}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} />
              <span>Carrinho</span>
            </div>
            {cartCount > 0 && (
              <span className="bg-black text-white rounded-full px-2 py-1 text-xs">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </aside>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default LayoutBase;
