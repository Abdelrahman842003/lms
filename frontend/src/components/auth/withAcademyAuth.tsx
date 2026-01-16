'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Higher-Order Component to protect academy routes
 * Redirects to /academy/login if user is not authenticated or not an academy
 */
export function withAcademyAuth<P extends object>(
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
          const token = localStorage.getItem('token');
          const userType = localStorage.getItem('userType');
          const user = localStorage.getItem('user');

          // If no token or user data, redirect to login
          if (!token || !user) {
            window.location.href = '/academy/login';
            return;
          }

          // Check if user is academy
          if (userType !== 'academy') {
            window.location.href = '/academy/login';
            return;
          }

          // User is authenticated and is academy
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          window.location.href = '/academy/login';
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    return <Component {...props} />;
  };
}
