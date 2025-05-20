import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import Account from './pages/Account';
import Cart from './pages/Cart';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Identification from './pages/Identification';
import Login from './pages/Login';
import Payment from './pages/Payment';
import Register from './pages/Register';
import SearchFound from './pages/SearchFound';
import SneakerDetail from './pages/SneakerDetail';
import Wishlist from './pages/Wishlist';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/search" element={<SearchFound />} />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route path="/sneaker/:slug" element={<SneakerDetail />} />

              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />

              <Route path="/checkout/cart" element={<Cart />} />
              <Route
                path="/checkout/identification"
                element={<Identification />}
              />

              <Route path="/checkout/payment" element={<Payment />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
