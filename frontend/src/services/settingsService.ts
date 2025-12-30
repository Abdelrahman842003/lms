import { fetchApi } from './authService';

export interface Setting {
  key: string;
  value: string;
  group?: string;
}

export const getSettings = async (): Promise<Record<string, string>> => {
  return await fetchApi('/admin/settings', {
    method: 'GET',
  });
};

export const updateSettings = async (settings: Setting[]): Promise<void> => {
  await fetchApi('/admin/settings', {
    method: 'POST',
    body: JSON.stringify({ settings }),
  });
};

export const getPublicSettings = async (): Promise<Record<string, string>> => {
  return await fetchApi('/settings/public', {
    method: 'GET',
  });
};
