'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      // Redirect based on role if possible, or default to home/login
      // For now, let's redirect to home where they can choose login
      router.push('/');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
      // User is logged in but doesn't have permission
      // Redirect to their dashboard or home
      if (user.userType === 'teacher') router.push('/teacher/dashboard');
      else if (user.userType === 'student') router.push('/student/dashboard');
      else router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, user, authLoading, allowedRoles, router]);

  if (authLoading || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
