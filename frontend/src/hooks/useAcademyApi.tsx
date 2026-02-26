/**
 * Academy API Hook
 *
 * Integrates the Academy Context with the API Client,
 * automatically updating the API client's academy context
 * when the academy changes.
 */

'use client';

import { useEffect } from 'react';
import { useAcademy } from '@/contexts/AcademyContext';
import { apiClient } from '@/lib/apiClient';

/**
 * Hook to automatically sync academy context with API client
 *
 * Place this hook in your root layout or a component near
 * the top of your component tree to ensure the API client
 * always has the current academy context.
 *
 * @example
 * ```tsx
 * function RootLayout({ children }) {
 *   return (
 *     <AcademyProvider>
 *       <AcademyApiSync />
 *       {children}
 *     </AcademyProvider>
 *   );
 * }
 * ```
 */
export function AcademyApiSync(): null {
  const { currentAcademy, isLoading } = useAcademy();

  useEffect(() => {
    // Skip while loading
    if (isLoading) return;

    // Update API client with current academy
    apiClient.setAcademyContext(currentAcademy?.id ?? null);
  }, [currentAcademy, isLoading]);

  return null;
}

/**
 * Hook to make API requests with automatic academy context
 *
 * This is a convenience hook that provides direct access to the
 * API client methods with proper TypeScript types.
 *
 * @example
 * ```tsx
 * function StudentsList() {
 *   const { get } = useApiClient();
 *   const [students, setStudents] = useState([]);
 *
 *   useEffect(() => {
 *     get<Student[]>('/teacher/students')
 *       .then(setStudents)
 *       .catch(console.error);
 *   }, [get]);
 *
 *   return <div>{/* render students *\/}</div>;
 * }
 * ```
 */
export function useApiClient() {
  const { currentAcademy } = useAcademy();

  // Ensure API client is synced
  useEffect(() => {
    apiClient.setAcademyContext(currentAcademy?.id ?? null);
  }, [currentAcademy]);

  return {
    get: <T extends unknown>(endpoint: string, options?: Parameters<typeof apiClient.get>[1]) =>
      apiClient.get<T>(endpoint, options),
    post: <T extends unknown>(endpoint: string, data?: unknown, options?: Parameters<typeof apiClient.post>[2]) =>
      apiClient.post<T>(endpoint, data, options),
    put: <T extends unknown>(endpoint: string, data?: unknown, options?: Parameters<typeof apiClient.put>[2]) =>
      apiClient.put<T>(endpoint, data, options),
    patch: <T extends unknown>(endpoint: string, data?: unknown, options?: Parameters<typeof apiClient.patch>[2]) =>
      apiClient.patch<T>(endpoint, data, options),
    delete: <T extends unknown>(endpoint: string, options?: Parameters<typeof apiClient.delete>[1]) =>
      apiClient.delete<T>(endpoint, options),
  };
}

/**
 * HOC to inject API client methods into a component
 *
 * @example
 * ```tsx
 * function StudentsList({ get }) {
 *   const [students, setStudents] = useState([]);
 *
 *   useEffect(() => {
 *     get<Student[]>('/teacher/students').then(setStudents);
 *   }, [get]);
 *
 *   return <div>{/* render students *\/}</div>;
 * }
 *
 * export default withApiClient(StudentsList);
 * ```
 */
export function withApiClient<P extends { apiClient: typeof apiClient }>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, 'apiClient'>> {
  return function WithApiClientComponent(props) {
    const api = useApiClient();

    return <Component {...(props as P)} apiClient={api} />;
  };
}

export default AcademyApiSync;
