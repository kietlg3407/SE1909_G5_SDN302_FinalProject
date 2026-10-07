import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoadingState = () => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '60vh',
    }}
    aria-live="polite"
    aria-label="Đang xác thực quyền truy cập"
  >
    <div className="spinner" />
  </div>
);

const UnauthorizedState = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page" role="alert">
      <div className="not-found-card">
        <ShieldX size={48} aria-hidden="true" />
        <h1>403</h1>
        <h2>Không Có Quyền Truy Cập</h2>
        <p>Bạn cần có quyền quản trị viên để xem trang này.</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          Quay Về Trang Chủ
        </button>
      </div>
    </div>
  );
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (user.role !== 'admin') {
    return <UnauthorizedState />;
  }

  return children !== undefined ? children : <Outlet />;
};

export default AdminRoute;