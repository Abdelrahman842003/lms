/**
 * Authentication and Permission Hooks
 * 
 * Custom hooks for handling authentication state, permissions,
 * and role-based access control.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useApiState } from './useApiState';
import { getCurrentUser } from '@/services/authService';
import type { UserType } from '@/types/auth.types';

// Enhanced auth hook with additional utilities
export function useAuthState() {
  const auth = useAuth();
  
  const permissions = useMemo(() => {
    return auth.user?.permissions || [];
  }, [auth.user?.permissions]);
  
  const hasPermission = useCallback((permission: string) => {
    return permissions.includes(permission);
  }, [permissions]);
  
  const hasRole = useCallback((role: UserType) => {
    return auth.user?.userType === role;
  }, [auth.user?.userType]);
  
  const hasAnyRole = useCallback((roles: UserType[]) => {
    return roles.includes(auth.user?.userType as UserType);
  }, [auth.user?.userType]);
  
  const isAdmin = useMemo(() => false, []);  // Admin uses Filament, not frontend
  const isTeacher = useMemo(() => hasRole('teacher'), [hasRole]);
  const isStudent = useMemo(() => hasRole('student'), [hasRole]);
  const isParent = useMemo(() => hasRole('parent'), [hasRole]);
  const isSecretary = useMemo(() => hasRole('secretary'), [hasRole]);
  const isAcademy = useMemo(() => hasRole('academy'), [hasRole]);
  
  // Get dashboard path based on user role
  const getDashboardPath = useCallback(() => {
    if (!auth.user) return '/';
    
    switch (auth.user.userType) {
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      case 'parent':
        return '/parent/children';
      case 'academy':
        return '/academy/dashboard';
      case 'secretary':
        return '/teacher/dashboard'; // Secretary uses teacher dashboard
      default:
        return '/';
    }
  }, [auth.user]);
  
  return {
    ...auth,
    permissions,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    isSecretary,
    isAcademy,
    getDashboardPath,
  };
}

// Hook for refreshing user data
export function useRefreshUser() {
  const { user, updateUser } = useAuth();
  
  const { refetch, isLoading, error } = useApiState({
    key: `user-refresh-${user?.userType}`,
    fetcher: async () => {
      if (!user?.userType) throw new Error('No user type');
      return getCurrentUser(user.userType as UserType);
    },
    enabled: !!user?.userType,
    onSuccess: (data) => {
      updateUser(data);
    },
  });
  
  return {
    refreshUser: refetch,
    isRefreshing: isLoading,
    refreshError: error,
  };
}

// Permission-based component wrapper hook
export function usePermissionGuard() {
  const { hasPermission, hasRole, hasAnyRole } = useAuthState();
  
  const canAccess = useCallback((requirements: {
    permissions?: string[];
    roles?: UserType[];
    requireAll?: boolean; // If true, user must have ALL permissions/roles
  }) => {
    const { permissions = [], roles = [], requireAll = false } = requirements;
    
    // Check permissions
    const permissionCheck = permissions.length === 0 || (
      requireAll 
        ? permissions.every(hasPermission)
        : permissions.some(hasPermission)
    );
    
    // Check roles
    const roleCheck = roles.length === 0 || hasAnyRole(roles);
    
    return permissionCheck && roleCheck;
  }, [hasPermission, hasAnyRole]);
  
  return { canAccess };
}

export default {
  useAuthState,
  useRefreshUser,
  usePermissionGuard,
};