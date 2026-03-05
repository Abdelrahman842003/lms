import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from './tokenManager';
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
  (config) => {
    const headers = AxiosHeaders.from(config.headers || {});
    const requestUrl = new URL(config.url || '', config.baseURL || baseURL).toString();
    const trustedRequest = isTrustedUrl(requestUrl);
    const token = getAccessToken();

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

export default axiosInstance;
