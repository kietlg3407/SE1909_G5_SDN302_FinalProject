import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Đăng xuất
  const logout = useCallback((showToast = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (showToast) {
      toast.success('Đã đăng xuất thành công');
    }
  }, []);

  // Khởi tạo trạng thái đăng nhập từ localStorage khi app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Lấy thông tin mới nhất từ backend
          const res = await api.get('/api/users/profile');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
          console.error('Không thể xác thực phiên làm việc:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post('/api/users/login', { email: cleanEmail, password });
      const userData = res.data;
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success(`Chào mừng ${userData.name} đã quay trở lại!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Đăng ký
  const register = async (name, email, password) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post('/api/users/register', { name: name.trim(), email: cleanEmail, password });
      const userData = res.data;
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Đăng ký tài khoản thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Cập nhật Profile (tên, avatar)
  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/api/users/profile', profileData);
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Cập nhật hồ sơ thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Đổi mật khẩu
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/api/users/change-password', { currentPassword, newPassword });
      toast.success(res.data.message || 'Đổi mật khẩu thành công');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Tải lại thông tin cá nhân
  const refreshUser = async () => {
    try {
      const res = await api.get('/api/users/profile');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error('Lỗi khi tải lại user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
