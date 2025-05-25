import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  
  if (token) {
    const { state } = JSON.parse(token);
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuth.getState();
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 