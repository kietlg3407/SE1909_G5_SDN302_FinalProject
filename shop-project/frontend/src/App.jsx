import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/admin/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import CouponsPage from './pages/admin/CouponsPage';
import ProductsPage from './pages/ProductsPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
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
              <Route path="coupons" element={<CouponsPage />} />
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
    </AuthProvider>
  );
}

export default App;
