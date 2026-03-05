import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, refreshAccessToken as tokenRefresh } from './tokenManager';
import { getApiBaseUrl } from '@/config/api-config';

// Handle different API URL configurations
const baseURL = `${getApiBaseUrl()}/api`;
const trustedApiUrl = new URL(getApiBaseUrl());
const trustedOrigin = trustedApiUrl.origin;
const trustedPath = trustedApiUrl.pathname.replace(/\/+$/, '') || '/';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
  },
});

function isTrustedUrl(url: string): boolean {
  const requestUrl = new URL(url, baseURL);

  if (requestUrl.origin !== trustedOrigin) {
    return false;
  }

  if (trustedPath === '/') {
    return true;
  }

  return requestUrl.pathname === trustedPath || requestUrl.pathname.startsWith(`${trustedPath}/`);
}

function shouldSetJsonContentType(
  config: InternalAxiosRequestConfig,
  headers: AxiosHeaders
): boolean {
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get' || method === 'head' || config.data == null) {
    return false;
  }

  if (headers.has('Content-Type')) {
    return false;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    return false;
  }

  if (typeof URLSearchParams !== 'undefined' && config.data instanceof URLSearchParams) {
    return false;
  }

  if (typeof Blob !== 'undefined' && config.data instanceof Blob) {
    return false;
  }

  return true;
}

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use(
  async (config) => {
    const headers = AxiosHeaders.from(config.headers || {});
    const requestUrl = new URL(config.url || '', config.baseURL || baseURL).toString();
    const trustedRequest = isTrustedUrl(requestUrl);
    let token = getAccessToken();

    // On hard refresh, in-memory token may be empty while refresh cookie is still valid.
    // Prime token once before protected requests to avoid first-load 401s.
    if (trustedRequest && !token && typeof window !== 'undefined') {
      const hasStoredSessionHint = !!localStorage.getItem('userType');
      if (hasStoredSessionHint) {
        token = await tokenRefresh();
      }
    }

    if (trustedRequest && token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      headers.delete('Authorization');
    }

    if (shouldSetJsonContentType(config, headers)) {
      headers.set('Content-Type', 'application/json');
    } else if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      headers.delete('Content-Type');
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Retry once on 401 after refreshing token from httpOnly refresh cookie.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error?.response?.status;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = new URL(
      originalRequest.url || '',
      originalRequest.baseURL || baseURL
    ).toString();
    const trustedRequest = isTrustedUrl(requestUrl);

    if (status === 401 && trustedRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await tokenRefresh();
        if (newToken) {
          const headers = AxiosHeaders.from(originalRequest.headers || {});
          headers.set('Authorization', `Bearer ${newToken}`);
          originalRequest.headers = headers;
          return axiosInstance.request(originalRequest);
        }
      } catch {
        // Fall through to auth event dispatch below.
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
