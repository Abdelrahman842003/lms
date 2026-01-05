import axios from 'axios';

// Handle different API URL configurations
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const baseURL = envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use(
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

export default axiosInstance;
