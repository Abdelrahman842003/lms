/**
 * Unified Axios Wrapper to FetchApi Bridge
 * 
 * Intercepts all axios.get/post/put/delete calls and routes them through the 
 * unified fetchApi client to leverage native caching, service worker integration, 
 * and IndexedDB offline queueing.
 */

import { fetchApi } from '@/services/api/baseApi';

// Helper to convert params object to query string
function buildUrlWithParams(url: string, params?: Record<string, any>): string {
  if (!params) return url;
  
  const cleanParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      cleanParams[key] = String(val);
    }
  });

  const queryString = new URLSearchParams(cleanParams).toString();
  if (!queryString) return url;
  
  return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
}

// Map the URL path to a corresponding IndexedDB store for GET requests
function detectStoreName(url: string): string | undefined {
  const path = url.split('?')[0];
  
  if (path.includes('/academy/teachers')) return 'academyTeachers';
  if (path.includes('/academy/students')) return 'academyStudents';
  if (path.includes('/academy/lectures')) return 'academyLectures';
  if (path.includes('/academy/dashboard')) return 'academyDashboard';
  
  if (path.includes('/academy/grades')) return 'grades';
  if (path.includes('/academy/groups')) return 'groups';
  if (path.includes('/academy/attendance')) return 'attendances';
  if (path.includes('/academy/notifications')) return 'notifications';
  
  return undefined;
}

// Map mutations to their corresponding entity types for offline queuing
function detectEntityType(url: string): string | undefined {
  const path = url.split('?')[0];
  
  if (path.includes('/academy/teachers')) return 'academyTeachers';
  if (path.includes('/academy/students')) return 'academyStudents';
  if (path.includes('/academy/lectures')) return 'academyLectures';
  
  if (path.includes('/academy/grades')) return 'grades';
  if (path.includes('/academy/groups')) return 'groups';
  if (path.includes('/academy/attendance')) return 'attendances';
  if (path.includes('/academy/notifications')) return 'notifications';
  
  return undefined;
}

// Attach a self-referential 'data' property so callers that destructure/access 
// response.data or response.data.data will both succeed.
function wrapResponseData(dataResult: any) {
  if (dataResult !== null && (typeof dataResult === 'object' || Array.isArray(dataResult))) {
    try {
      if (!('data' in dataResult)) {
        Object.defineProperty(dataResult, 'data', {
          get() {
            return this;
          },
          configurable: true,
          enumerable: false
        });
      }
    } catch (e) {
      console.warn('[axiosWrapper] Failed to define self-referential property', e);
    }
  }
  return dataResult;
}

export const axiosWrapper = {
  get: async (url: string, config?: any) => {
    const finalUrl = buildUrlWithParams(url, config?.params);
    const storeName = detectStoreName(finalUrl);
    
    const fetchOptions: any = {
      method: 'GET',
      headers: config?.headers,
    };
    
    if (storeName) {
      fetchOptions.offlineConfig = {
        storeName,
        skipCache: false
      };
    }
    
    const data = await fetchApi(finalUrl, fetchOptions);
    return { data: wrapResponseData(data), status: 200 };
  },
  
  post: async (url: string, data?: any, config?: any) => {
    const finalUrl = buildUrlWithParams(url, config?.params);
    const entityType = detectEntityType(finalUrl);
    
    const fetchOptions: any = {
      method: 'POST',
      headers: config?.headers,
      body: data ? JSON.stringify(data) : undefined,
    };
    
    if (entityType) {
      fetchOptions.offlineConfig = {
        entityType,
        entityId: data?.id || `new_${entityType}_${Date.now()}`
      };
    }
    
    const resData = await fetchApi(finalUrl, fetchOptions);
    return { data: wrapResponseData(resData), status: 200 };
  },
  
  put: async (url: string, data?: any, config?: any) => {
    const finalUrl = buildUrlWithParams(url, config?.params);
    const entityType = detectEntityType(finalUrl);
    
    const fetchOptions: any = {
      method: 'PUT',
      headers: config?.headers,
      body: data ? JSON.stringify(data) : undefined,
    };
    
    if (entityType) {
      fetchOptions.offlineConfig = {
        entityType,
        entityId: url.split('/').pop() || `update_${entityType}_${Date.now()}`
      };
    }
    
    const resData = await fetchApi(finalUrl, fetchOptions);
    return { data: wrapResponseData(resData), status: 200 };
  },
  
  delete: async (url: string, config?: any) => {
    const finalUrl = buildUrlWithParams(url, config?.params);
    const entityType = detectEntityType(finalUrl);
    
    const fetchOptions: any = {
      method: 'DELETE',
      headers: config?.headers,
    };
    
    if (entityType) {
      fetchOptions.offlineConfig = {
        entityType,
        entityId: url.split('/').pop() || `delete_${entityType}_${Date.now()}`
      };
    }
    
    const resData = await fetchApi(finalUrl, fetchOptions);
    return { data: wrapResponseData(resData), status: 200 };
  }
};

export default axiosWrapper;
