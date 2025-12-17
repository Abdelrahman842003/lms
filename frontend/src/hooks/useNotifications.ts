'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { initializeEcho, disconnectEcho } from '@/lib/echo';
import { onMessageListener } from '@/lib/firebase';
import toast from 'react-hot-toast';

export interface Notification {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  created_at: string;
}

interface UseNotificationsOptions {
  userId: string;
  userType: 'student' | 'teacher' | 'admin';
  token: string;
  onNotification?: (notification: Notification) => void;
  enableSound?: boolean;
}

// Deduplication storage key
const PROCESSED_NOTIFICATIONS_KEY = 'processed_notifications';
const NOTIFICATION_TTL = 5 * 60 * 1000; // 5 minutes

export function useNotifications({
  userId,
  userType,
  token,
  onNotification,
  enableSound = true,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const processedRef = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load processed notifications from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = sessionStorage.getItem(PROCESSED_NOTIFICATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as [string, number][];
        processedRef.current = new Map(parsed);
      } catch {
        processedRef.current = new Map();
      }
    }

    // Initialize audio
    audioRef.current = new Audio('/sounds/notification.mp3');
  }, []);

  // Save processed notifications to sessionStorage
  const saveProcessed = useCallback(() => {
    const entries = Array.from(processedRef.current.entries());
    sessionStorage.setItem(PROCESSED_NOTIFICATIONS_KEY, JSON.stringify(entries));
  }, []);

  // Check if notification was already processed (deduplication)
  const isProcessed = useCallback((notificationId: string): boolean => {
    const timestamp = processedRef.current.get(notificationId);
    if (!timestamp) return false;

    // Check if notification is still within TTL
    if (Date.now() - timestamp < NOTIFICATION_TTL) {
      return true;
    }

    // Clean up expired entry
    processedRef.current.delete(notificationId);
    return false;
  }, []);

  // Mark notification as processed
  const markProcessed = useCallback(
    (notificationId: string) => {
      processedRef.current.set(notificationId, Date.now());
      saveProcessed();

      // Clean up old entries (keep only last 100)
      if (processedRef.current.size > 100) {
        const entries = Array.from(processedRef.current.entries());
        entries.sort((a, b) => b[1] - a[1]); // Sort by timestamp desc
        processedRef.current = new Map(entries.slice(0, 100));
        saveProcessed();
      }
    },
    [saveProcessed]
  );

  // Handle incoming notification
  const handleNotification = useCallback(
    (notification: Notification) => {
      // Deduplication check
      if (isProcessed(notification.notification_id)) {
        return;
      }

      markProcessed(notification.notification_id);

      // Add to state
      setNotifications((prev) => [notification, ...prev]);

      // Show toast
      toast(notification.message, {
        duration: 5000,
        position: 'top-right',
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      // Play sound
      if (enableSound && audioRef.current) {
        audioRef.current.play().catch(() => {
          // Audio play failed - possibly due to autoplay restrictions
        });
      }

      // Callback
      onNotification?.(notification);
    },
    [isProcessed, markProcessed, enableSound, onNotification]
  );

  // Initialize WebSocket connection (Reverb)
  useEffect(() => {
    if (!userId || !token) {
      return;
    }

    const echo = initializeEcho(token);
    const channelName = `notifications.${userType}.${userId}`;

    const channel = echo.private(channelName);

    channel
      .listen('.new.notification', (data: Notification) => {
        handleNotification(data);
      })
      .subscribed(() => {
        setIsConnected(true);
      })
      .error((error: unknown) => {
        console.error('[Echo] Subscription error:', error);
        setIsConnected(false);
      });

    return () => {
      echo.leave(channelName);
      disconnectEcho();
      setIsConnected(false);
    };
  }, [userId, userType, token, handleNotification]);

  // Listen for FCM messages (foreground)
  useEffect(() => {
    let isMounted = true;

    const setupFcmListener = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = await onMessageListener();
        if (!isMounted) return;

        const fcmNotification: Notification = {
          notification_id: payload?.data?.notification_id || crypto.randomUUID(),
          title: payload?.notification?.title || 'Notification',
          message: payload?.notification?.body || '',
          type: payload?.data?.type || 'general',
          data: payload?.data || {},
          created_at: new Date().toISOString(),
        };

        handleNotification(fcmNotification);

        // Recursively listen for next message
        setupFcmListener();
      } catch (error) {
        console.error('[FCM] Listener error:', error);
        // Retry after delay
        setTimeout(() => {
          if (isMounted) setupFcmListener();
        }, 5000);
      }
    };

    setupFcmListener();

    return () => {
      isMounted = false;
    };
  }, [handleNotification]);

  // Clear notification from list
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.notification_id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    clearNotification,
    clearAll,
    unreadCount: notifications.length,
  };
}
