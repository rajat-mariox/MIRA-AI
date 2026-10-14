import axios from 'axios';
import { getToken, handleUnauthorized, isPublicAuthUrl } from '../lib/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 on an authenticated call = session expired/invalid: clear it and go to /login.
// Login / OTP / reset errors are shown on the form instead.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublicAuthUrl(error.config?.url)) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
