import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Chặn người dùng đã đăng nhập (Admin, Staff, Customer) truy cập vào các trang chỉ dành cho khách (Guest) như /login, /register
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div
          className="spinner-sm"
          style={{
            width: '32px',
            height: '32px',
            borderColor: 'rgba(79, 70, 229, 0.2)',
            borderTopColor: '#4f46e5',
          }}
        ></div>
      </div>
    );
  }

  // Nếu người dùng đã đăng nhập bất kể vai trò gì -> Chuyển hướng thẳng về trang chủ
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
