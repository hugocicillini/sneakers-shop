import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import Account from './pages/Account'; // Página de conta do usuário
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'; // Se você tiver uma página de registro

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rotas protegidas (requerem autenticação) */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

            {/* <Route path="/sneaker/:id" element={<SneakerDetail />} /> */}
            {/* 
          Exemplo de outra rota protegida:
          <Route 
          path="/cart" 
          element={
            <ProtectedRoute>
            <Cart />
            </ProtectedRoute>
            } 
            /> 
            */}
          </Routes>
        </BrowserRouter>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
