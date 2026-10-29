import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const TOKEN_KEY = 'token';

const getStoredToken = () => {
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) return localToken;
  return sessionStorage.getItem(TOKEN_KEY);
};

const clearStoredCredentials = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('user');
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('user');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      clearStoredCredentials();

      if (typeof window !== 'undefined') {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const isLoginPage = window.location.pathname === '/login';

        window.dispatchEvent(new CustomEvent('api:unauthorized'));

        if (!isLoginPage) {
          const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
          window.location.assign(loginUrl);
        }
      }
    } else if (status === 403 && typeof window !== 'undefined') {
      console.warn('Forbidden request: the current user lacks permission.');
      window.dispatchEvent(
        new CustomEvent('api:forbidden', {
          detail: {
            message:
              error.response?.data?.message ||
              'You do not have permission to perform this action.',
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;
