/**
 * Academy Dashboard Service
 * Handles dashboard statistics and overview data
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

// ========== Dashboard ==========
export const getDashboardStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/dashboard`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAcademyOverview = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/overview`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getMonthlyStatistics = async (year: number, month: number) => {
  const response = await axios.get(`${API_BASE_URL}/academy/statistics/monthly`, {
    headers: getAuthHeaders(),
    params: { year, month },
  });
  return response.data;
};

export const getRevenueAnalytics = async (period: 'week' | 'month' | 'year' = 'month') => {
  const response = await axios.get(`${API_BASE_URL}/academy/analytics/revenue`, {
    headers: getAuthHeaders(),
    params: { period },
  });
  return response.data;
};