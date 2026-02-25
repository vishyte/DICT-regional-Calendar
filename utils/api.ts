import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Railway backend URL (hardcoded for both Firebase and Railway deployments)
const RAILWAY_BACKEND_URL = 'https://dict-regional-calendar-backend-production-b40c.up.railway.app/api';

// Prefer build-time `VITE_API_URL`. If not set, fall back to Railway backend
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || RAILWAY_BACKEND_URL;

console.log('API base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('is_superadmin');
      localStorage.removeItem('current_local_user');
      // Reload the page - the app will handle routing to login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: any) => api.post('/users/register', userData),
  login: (credentials: any) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
};

export const activitiesAPI = {
  getAll: () => api.get('/activities'),
  create: (activity: any) => api.post('/activities', activity),
  update: (id: number, activity: any) => api.put(`/activities/${id}`, activity),
  delete: (id: number) => api.delete(`/activities/${id}`),
};

export const usersAPI = {
  getAll: () => api.get('/users/all'),
  create: (userData: any) => api.post('/users', userData),
  update: (id: number, userData: any) => api.put(`/users/${id}`, userData),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export default api;
