import { fetchApi } from './api/baseApi';

export interface Setting {
  key: string;
  value: string;
  group?: string;
}

export const getPublicSettings = async (): Promise<Record<string, string>> => {
  return await fetchApi('/api/v1/public-settings', {
    method: 'GET',
  });
};
