'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/tokenManager';

/**
 * Higher-Order Component to protect admin routes
 * Redirects to /admin/login if user is not authenticated or not an admin
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const [_, setIsAuthorized] = useState(false);
    const [__, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        try {
          // Check if user is logged in
          const token = getAccessToken();
          const userType = localStorage.getItem('userType');
          const user = localStorage.getItem('user');

          // If no token or user data, redirect to login
          if (!token || !user) {
            // No token or user data found, redirecting to login
            window.location.href = '/admin/login';
            return;
          }

          // Check if user is admin
          if (userType !== 'admin') {
            // User is not admin, redirecting to login
            window.location.href = '/admin/login';
            return;
          }

          // User is authenticated and is admin
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          window.location.href = '/admin/login';
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    // Optimistic rendering: Render children immediately
    // The useEffect will handle redirection if unauthorized
    return <Component {...props} />;
  };
}
