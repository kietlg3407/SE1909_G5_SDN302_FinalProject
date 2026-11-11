import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/admin/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import CouponsPage from './pages/admin/CouponsPage';
import ProductsPage from './pages/ProductsPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminClassificationsPage from './pages/admin/AdminClassificationsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminCommentsPage from './pages/admin/AdminCommentsPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import MyReviewsPage from './pages/MyReviewsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import './index.css';

const NotFound = () => (
  <div className="not-found-page">
    <div className="not-found-card">
      <h1>404</h1>
      <h2>Không Tìm Thấy Trang</h2>
      <p>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="btn-primary">Quay Về Trang Chủ</Link>
    </div>
  </div>
);

const PublicLayout = () => (
  <div className="app-layout">
    <Navbar />
    <main className="main-content">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AdminLayout = () => (
  <div className="admin-app-layout">
    <Navbar />
    <div className="admin-app-body">
      <Sidebar />
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
              fontSize: '14px',
              border: '1px solid #334155',
            },
          }}
        />
        <Routes>
          {/* Public & Customer Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              }
            />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/favorites" element={<Navigate to="/wishlist" replace />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <MyOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reviews"
              element={
                <ProtectedRoute>
                  <MyReviewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Phân hệ Quản trị /admin: Cho phép cả Admin và Staff */}
          <Route path="/admin" element={<AdminRoute allowedRoles={['admin', 'staff']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="classifications" element={<AdminClassificationsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="comments" element={<AdminCommentsPage />} />
              <Route path="coupons" element={<CouponsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              {/* Trang Quản lý Người dùng: Chỉ cho phép Quản trị viên (Admin) */}
              <Route
                path="users"
                element={
                  <AdminRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </AdminRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
