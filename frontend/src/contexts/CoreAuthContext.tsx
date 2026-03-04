/**
 * Core Authentication Context
 * 
 * This context handles the basic authentication state without
 * the complex teacher/child/academy selection logic.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  loginTeacher,
  loginStudent,
  loginSecretary,
  loginParent,
  logout as apiLogout,
  getCurrentUser,
} from "@/services/authService";
import { User } from "@/types";

const VALID_USER_TYPES = ['teacher', 'student', 'secretary', 'parent', 'academy'] as const;
type ValidUserType = typeof VALID_USER_TYPES[number];

function isValidUserType(value: unknown): value is ValidUserType {
  return typeof value === 'string' && VALID_USER_TYPES.includes(value as ValidUserType);
}

interface CoreAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    phone: string,
    password: string,
    userType?: "teacher" | "student" | "secretary" | "parent" | "academy"
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const CoreAuthContext = createContext<CoreAuthContextType | undefined>(undefined);

export function CoreAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const storedUserObj = JSON.parse(storedUser);
        if (isValidUserType(storedUserObj?.userType)) {
          setUser(storedUserObj);
          // Ensure cookie is set only for supported frontend roles
          document.cookie = "auth_state=true; path=/; max-age=2592000; SameSite=Lax";
          document.cookie = `user_role=${storedUserObj.userType}; path=/; max-age=2592000; SameSite=Lax`;
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("userType");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          document.cookie = "auth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }
    } catch (error) {
      console.error("CoreAuthContext: Failed to parse stored user:", error);
    }

    // Validate user session in background
    const validateSession = async () => {
      try {
        const userType = localStorage.getItem("userType");

        if (userType && isValidUserType(userType)) {
          const response = await getCurrentUser(userType);
          const userData: User = {
            id: response.user.id,
            name: response.user.name,
            ...(response.user.username && { username: response.user.username }),
            userType: response.role,
            createdAt: response.user.created_at || new Date().toISOString(),
            updatedAt: response.user.updated_at || new Date().toISOString(),
            avatar: response.user.avatar,
            phone: response.user.phone,
            parent_phone: response.parent_phone || response.user.parent_phone,
            location: response.user.location,
            gender: response.user.gender,
            education_type: response.user.education_type,
            teachers: response.teachers || response.user.teachers,
            permissions: response.user.permissions,
            is_independent_active: response.user.is_independent_active,
            academies: response.academies || response.user.academies,
          };

          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else if (userType && !isValidUserType(userType)) {
          clearAuth();
        }
      } catch (apiError: any) {
        if (apiError.status === 401) {
          console.error("Session invalid, clearing auth");
          clearAuth();
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();

    // Listen for auth events
    const handleUnauthorized = () => {
      clearAuth();
      window.location.href = "/login";
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const clearAuth = () => {
    setUser(null);
    localStorage.clear();
    document.cookie = "auth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "laravel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  const login = async (
    phone: string,
    password: string,
    userType: "teacher" | "student" | "secretary" | "parent" | "academy" = "teacher"
  ) => {
    try {
      setIsLoading(true);

      let response;
      if (userType === "teacher") {
        response = await loginTeacher(phone, password);
      } else if (userType === "student") {
        response = await loginStudent(phone, password);
      } else if (userType === "parent") {
        response = await loginParent(phone, password);
      } else if (userType === "academy") {
        const { loginAcademy } = await import("@/services/authService");
        response = await loginAcademy(phone, password);
      } else {
        response = await loginSecretary(phone, password);
      }

      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        ...(response.user.username && { username: response.user.username }),
        userType: response.role,
        createdAt: response.user.created_at || new Date().toISOString(),
        updatedAt: response.user.updated_at || new Date().toISOString(),
        avatar: response.user.avatar,
        phone: response.user.phone,
        parent_phone: response.user.parent_phone,
        location: response.user.location,
        gender: response.user.gender,
        education_type: response.user.education_type,
        teachers: response.teachers || response.user.teachers,
        permissions: response.user.permissions,
        is_independent_active: response.user.is_independent_active,
        academies: response.academies || response.user.academies,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // Store tokens
      const apiResponse = response as any;
      const token = apiResponse.token || apiResponse.access_token;
      if (token) {
        localStorage.setItem("token", token);
      }

      const refreshToken = apiResponse.refresh_token;
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      localStorage.setItem("userType", response.role);

      // Set auth cookies
      document.cookie = "auth_state=true; path=/; max-age=2592000; SameSite=Lax";
      document.cookie = `user_role=${response.role}; path=/; max-age=2592000; SameSite=Lax`;

    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const userType = localStorage.getItem("userType") as
        | "teacher" | "student" | "secretary" | "academy" | "parent" | null;

      let fcmToken = null;
      try {
        const { getFcmToken } = await import("@/lib/firebase");
        fcmToken = await getFcmToken();
      } catch (e) {
        console.error("Failed to get FCM token for logout:", e);
      }

      if (userType) {
        await apiLogout(userType, fcmToken);
      }

      try {
        const { deleteFcmToken } = await import("@/lib/firebase");
        await deleteFcmToken();
      } catch (e) {
        console.error("Failed to delete FCM token:", e);
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    if (!user?.userType) return;

    try {
      const response = await getCurrentUser(user.userType as any);
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        ...(response.user.username && { username: response.user.username }),
        userType: response.role,
        createdAt: response.user.created_at || new Date().toISOString(),
        updatedAt: response.user.updated_at || new Date().toISOString(),
        avatar: response.user.avatar,
        phone: response.user.phone,
        parent_phone: response.parent_phone || response.user.parent_phone,
        location: response.user.location,
        gender: response.user.gender,
        education_type: response.user.education_type,
        teachers: response.teachers || response.user.teachers,
        permissions: response.user.permissions,
        is_independent_active: response.user.is_independent_active,
        academies: response.academies || response.user.academies,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      if ((error as any).status === 401) {
        clearAuth();
        router.push("/login");
      }
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <CoreAuthContext.Provider value={value}>
      {children}
    </CoreAuthContext.Provider>
  );
}

export function useCoreAuth() {
  const context = useContext(CoreAuthContext);
  if (context === undefined) {
    throw new Error("useCoreAuth must be used within a CoreAuthProvider");
  }
  return context;
}

export { CoreAuthContext };
