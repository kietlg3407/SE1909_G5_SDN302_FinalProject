import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const AuthContext = createContext(null);

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const readStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.warn('Stored user data is invalid and will be cleared.', error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const persistAuth = (userData, token) => {
  if (!token || !userData) {
    throw new Error('Authentication response did not include valid credentials');
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
};

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const applyAuth = useCallback((userData, authToken) => {
    const nextToken = authToken || token;
    persistAuth(userData, nextToken);
    setToken(nextToken);
    setUser(userData);
  }, [token]);

  const clearAuth = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async (showToast = true) => {
    clearAuth();
    if (showToast) toast.success('Đã đăng xuất thành công');
    return { success: true };
  }, [clearAuth]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = readStoredUser();

      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) {
        setToken(storedToken);
        if (storedUser) setUser(storedUser);
      }

      try {
        const response = await api.get('/api/users/profile');
        const freshUser = response.data;

        if (isMounted) {
          persistAuth(freshUser, storedToken);
          setUser(freshUser);
        }
      } catch (error) {
        clearAuth();
        if (error.response?.status !== 401) {
          console.error('Không thể xác thực phiên làm việc:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, [clearAuth]);

  const login = useCallback(async (email, password) => {
    try {
      setActionLoading(true);
      const response = await api.post('/api/users/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const userData = response.data;

      applyAuth(userData, userData.token);
      toast.success(`Chào mừng ${userData.name} đã quay trở lại!`);
      return { success: true, user: userData };
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!'
      );
      toast.error(message);
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  }, [applyAuth]);

  const register = useCallback(async (name, email, password) => {
    try {
      setActionLoading(true);
      const response = await api.post('/api/users/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      const userData = response.data;

      applyAuth(userData, userData.token);
      toast.success('Đăng ký tài khoản thành công!');
      return { success: true, user: userData };
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Đăng ký thất bại. Vui lòng thử lại!'
      );
      toast.error(message);
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  }, [applyAuth]);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setActionLoading(true);
      const response = await api.put('/api/users/profile', profileData);
      const updatedUser = { ...user, ...response.data };
      applyAuth(updatedUser, response.data.token || token);
      toast.success('Cập nhật hồ sơ thành công!');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = getErrorMessage(error, 'Cập nhật thất bại');
      toast.error(message);
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  }, [applyAuth, token, user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setActionLoading(true);
      const response = await api.put('/api/users/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(response.data.message || 'Đổi mật khẩu thành công');
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Đổi mật khẩu thất bại');
      toast.error(message);
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/api/users/profile');
      const freshUser = response.data;
      applyAuth(freshUser, token);
      return freshUser;
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể tải lại thông tin người dùng');
      console.error(message, error);
      return null;
    }
  }, [applyAuth, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      actionLoading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'staff',
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refreshUser,
    }),
    [
      actionLoading,
      changePassword,
      loading,
      login,
      logout,
      refreshUser,
      register,
      token,
      updateProfile,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
