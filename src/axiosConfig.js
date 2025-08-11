// src/utils/axiosConfig.js
import axios from 'axios';

// Just importing this file sets up the interceptors globally!

// Set default base URL
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3002';
axios.defaults.withCredentials = true;

// Request interceptor - automatically adds token to every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - automatically updates token when server sends new one
axios.interceptors.response.use(
  (response) => {
    // Check if server sent a new token
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      // Update both possible token storage keys (in case you use both)
      localStorage.setItem('token', newToken);
      localStorage.setItem('authToken', newToken);
      console.log('🔄 Token automatically refreshed');
    }
    return response;
  },
  (error) => {
    // Handle expired tokens
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
