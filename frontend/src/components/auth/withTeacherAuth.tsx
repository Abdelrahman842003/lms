'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/tokenManager';

/**
 * Higher-Order Component to protect teacher routes
 * Redirects to /teacher/login if user is not authenticated or not a teacher
 */
export function withTeacherAuth<P extends object>(
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
            window.location.href = '/teacher/login';
            return;
          }

          // Check if user is teacher
          if (userType !== 'teacher') {
            window.location.href = '/teacher/login';
            return;
          }

          // User is authenticated and is teacher
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          window.location.href = '/teacher/login';
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    return <Component {...props} />;
  };
}
