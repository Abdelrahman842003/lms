import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

export const getPlatformPayments = async (page = 1, perPage = 15, filters: {
  search?: string;
  month?: number;
  year?: number;
  status?: 'pending' | 'paid';
} = {}) => {
  const response = await axios.get(`${API_BASE_URL}/admin/platform-payments`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, ...filters },
  });
  return response.data;
};

export const getPlatformPaymentStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/admin/platform-payments/stats`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const confirmPlatformPayment = async (id: string, type: 'academy' | 'teacher' = 'academy') => {
  const response = await axios.post(
    `${API_BASE_URL}/admin/platform-payments/${id}/confirm`,
    { type },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
