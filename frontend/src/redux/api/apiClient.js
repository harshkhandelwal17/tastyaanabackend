import axios from 'axios'

// Normalize base URL and ensure "/api" suffix
const rawBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmed = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token might be expired or invalid
      localStorage.removeItem('token');
      // Optionally redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;