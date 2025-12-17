"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  loginTeacher, 
  loginStudent, 
  loginAdmin, 
  loginSecretary, 
  logout as apiLogout, 
  getCurrentUser,
  TeacherInfo 
} from '@/services/authService';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedTeacher: TeacherInfo | null;
  selectTeacher: (teacher: TeacherInfo) => void;
  login: (username: string, password: string, userType?: 'teacher' | 'student' | 'secretary' | 'admin') => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  enableNotifications: () => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  name: string;
  userType: 'teacher' | 'student' | 'secretary' | 'admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(null);

  useEffect(() => {
    // Load user from localStorage immediately (synchronously, client-side only)
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        // Ensure cookie is set if user exists in localStorage (sync)
        document.cookie = "auth_state=true; path=/; max-age=2592000; SameSite=Lax";
        
        // Also restore user_role cookie if possible from localStorage data
        const storedUserObj = JSON.parse(storedUser);
        if (storedUserObj.userType) {
             document.cookie = `user_role=${storedUserObj.userType}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
      
      // Load selected teacher
      const storedTeacher = localStorage.getItem('selectedTeacher');
      if (storedTeacher) {
        setSelectedTeacher(JSON.parse(storedTeacher));
      }
    } catch (error) {
      console.error('AuthContext: Failed to parse stored user/teacher:', error);
    }

    // Then refresh user data from API if authenticated
    const checkAuth = async () => {
      try {
        const userType = localStorage.getItem('userType') as 'teacher' | 'student' | 'secretary' | 'admin' | null;


        if (userType) {
          // Fetch fresh user data from API in the background
          try {
            // Pass empty string as token since we use cookies now

            const response = await getCurrentUser(userType);

            
            const userData: User = {
              id: response.user.id,
              name: response.user.name,
              username: response.user.username,
              userType: response.role,
              createdAt: response.user.created_at || new Date().toISOString(),
              updatedAt: response.user.updated_at || new Date().toISOString(),
              avatar: response.user.avatar,
              phone: response.user.phone,
              parent_phone: response.user.parent_phone,
              location: response.user.location,
              gender: response.user.gender,
              education_type: response.user.education_type,
              teachers: response.teachers, // Add teachers list to user object
            };

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            // If student, validate/update selected teacher
            if (userType === 'student' && response.teachers && response.teachers.length > 0) {
              const currentSelected = localStorage.getItem('selectedTeacher');
              let bestTeacher = null;

              // Smart selection: Prioritize Active > Grace Period > None
              const activeTeacher = response.teachers.find((t: any) => t.status === 'active');
              const graceTeacher = response.teachers.find((t: any) => t.status === 'grace_period');
              bestTeacher = activeTeacher || graceTeacher || null;

              if (currentSelected) {
                const parsedCurrent = JSON.parse(currentSelected);
                const updatedCurrent = response.teachers.find((t: any) => t.teacher_id === parsedCurrent.teacher_id);
                
                // If current is still valid (active/grace), keep it. Otherwise switch to best.
                if (updatedCurrent && (updatedCurrent.status === 'active' || updatedCurrent.status === 'grace_period')) {
                    setSelectedTeacher(updatedCurrent);
                    localStorage.setItem('selectedTeacher', JSON.stringify(updatedCurrent));
                } else {
                    // Current is invalid/expired/inactive -> Switch to best available
                    if (bestTeacher) {
                        setSelectedTeacher(bestTeacher);
                        localStorage.setItem('selectedTeacher', JSON.stringify(bestTeacher));
                    } else {
                        setSelectedTeacher(null);
                        localStorage.removeItem('selectedTeacher');
                    }
                }
              } else {
                // No current selection -> Select best
                if (bestTeacher) {
                    setSelectedTeacher(bestTeacher);
                    localStorage.setItem('selectedTeacher', JSON.stringify(bestTeacher));
                }
              }
            }

          } catch (apiError: any) {
            console.error('AuthContext: Failed to fetch fresh user data:', apiError);
            
            // If unauthorized (401) or unauthenticated, clear auth
            if (apiError.status === 401 || apiError.message?.toLowerCase().includes('unauthenticated')) {
              console.error('AuthContext: User unauthenticated (401), clearing session. Error details:', apiError);
              setUser(null);
              setSelectedTeacher(null);
              localStorage.clear();
            }
            // If API fails for other reasons (e.g. network), keep the stored user
          }
        } else if (!user) {
          // No userType and no user - ensure user is null

          setUser(null);
          setSelectedTeacher(null);
        }
      } catch (error) {
        console.error('AuthContext: Failed to check authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Listen for global unauthorized events
    const handleUnauthorized = () => {

      setUser(null);
      setSelectedTeacher(null);
      localStorage.clear();
      
      // Clear all auth cookies to prevent middleware loops
      document.cookie = "auth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "laravel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      window.location.href = '/login';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (username: string, password: string, userType: 'teacher' | 'student' | 'secretary' | 'admin' = 'teacher') => {
    try {
      setIsLoading(true);
      
      // Call appropriate login function based on user type
      let response;
      if (userType === 'teacher') {
        response = await loginTeacher(username, password);
      } else if (userType === 'student') {
        // For students, username is actually identifier (phone or username)
        response = await loginStudent(username, password);
      } else if (userType === 'admin') {
        response = await loginAdmin(username, password);
      } else {
        response = await loginSecretary(username, password);
      }
      
      // Create user object from response
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        username: response.user.username,
        userType: response.role,
        createdAt: response.user.created_at || new Date().toISOString(),
        updatedAt: response.user.updated_at || new Date().toISOString(),
        avatar: response.user.avatar,
        phone: response.user.phone,
        parent_phone: response.user.parent_phone,
        location: response.user.location,
        gender: response.user.gender,
        education_type: response.user.education_type,
        teachers: response.teachers,
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store token for Bearer auth
      const apiResponse = response as any;
      const token = apiResponse.token || apiResponse.access_token;
      if (token) {
        localStorage.setItem('token', token);
      }
      
      const refreshToken = apiResponse.refresh_token;
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      localStorage.setItem('userType', response.role);
      
      // For students, handle teacher selection
      if (userType === 'student' && response.teachers && response.teachers.length > 0) {
        localStorage.setItem('studentTeachers', JSON.stringify(response.teachers));
        
        // Smart selection: Prioritize Active > Grace Period > None
        const activeTeacher = response.teachers.find((t: any) => t.status === 'active');
        const graceTeacher = response.teachers.find((t: any) => t.status === 'grace_period');
        
        const bestTeacher = activeTeacher || graceTeacher || null;

        if (bestTeacher) {
            setSelectedTeacher(bestTeacher);
            localStorage.setItem('selectedTeacher', JSON.stringify(bestTeacher));
        } else {
            // If all are inactive/expired, don't select any (dashboard will handle this)
            setSelectedTeacher(null);
            localStorage.removeItem('selectedTeacher');
        }
      }
      
      // Set a cookie for middleware to detect auth state
      document.cookie = "auth_state=true; path=/; max-age=2592000; SameSite=Lax"; // 30 days
      // Set user role cookie for middleware redirection
      document.cookie = `user_role=${response.role}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectTeacher = (teacher: TeacherInfo) => {
    setSelectedTeacher(teacher);
    localStorage.setItem('selectedTeacher', JSON.stringify(teacher));
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData),
      // });
      // const data = await response.json();

      // Mock user for development
      const mockUser: User = {
        id: '1',
        name: userData.name,
        username: userData.username,
        userType: userData.userType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const userType = localStorage.getItem('userType') as 'teacher' | 'student' | 'secretary' | 'admin' | null;
      
      // 1. Get current FCM token to send to backend
      let fcmToken = null;
      try {
        const { getFcmToken } = await import('@/lib/firebase');
        fcmToken = await getFcmToken();
      } catch (e) {
        console.error('Failed to get FCM token for logout:', e);
      }

      // 2. Call Backend Logout
      if (userType) {
        await apiLogout(userType, fcmToken);
      }

      // 3. Delete FCM token from Firebase (Client-side cleanup)
      try {
        const { deleteFcmToken } = await import('@/lib/firebase');
        await deleteFcmToken();
      } catch (e) {
        console.error('Failed to delete FCM token client-side:', e);
      }

    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear user state
      setUser(null);
      setSelectedTeacher(null);
      localStorage.clear();
      // Clear cookies
      document.cookie = "auth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "laravel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

    const enableNotifications = async () => {
      try {
        const { requestForToken, onMessageListener } = await import('@/lib/firebase');
        const token = await requestForToken();
        
        if (token) {

          const { storeDeviceToken } = await import('@/services/notificationService');
          await storeDeviceToken(token);
          
          // Setup listener for foreground messages
          onMessageListener().then((payload: any) => {

            
            // Dispatch custom event for other components (like NotificationDropdown)
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('notification:received', { detail: payload });
              window.dispatchEvent(event);
            }

            const { title, body } = payload.notification;
            
            // Use react-hot-toast for foreground notification
            import('react-hot-toast').then(({ default: toast }) => {
              toast((t) => (
                <div onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
                  <p style={{ fontWeight: 'bold' }}>{title}</p>
                  <p>{body}</p>
                </div>
              ), {
                duration: 5000,
                position: 'top-right',
                style: {
                  background: '#333',
                  color: '#fff',
                  border: '1px solid #444',
                },
              });
            });
          });
        }
      } catch (error) {
        console.error('FCM enable failed:', error);
      }
    };

    const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    selectedTeacher,
    selectTeacher,
    login,
    logout,
    register,
    updateUser,
    enableNotifications,
  };

  // Removed automatic syncFcmToken useEffect for Lazy Permission

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
