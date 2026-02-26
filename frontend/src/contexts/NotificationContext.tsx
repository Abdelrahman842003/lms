'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: Notification[];
  isConnected: boolean;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
  userId: string;
  userType: 'student' | 'teacher';
  token: string;
  onNotification?: (notification: Notification) => void;
}

export function NotificationProvider({
  children,
  userId,
  userType,
  token,
  onNotification,
}: NotificationProviderProps) {
  const notificationState = useNotifications({
    userId,
    userType,
    token,
    onNotification,
    enableSound: true,
  });

  const value = useMemo(
    () => notificationState,
    [notificationState]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

// Export for convenience
export type { Notification };
