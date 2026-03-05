'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { ReceivedNotification as AppNotification } from '@/services/notificationService';
import { getAccessToken, refreshAccessToken } from '@/lib/tokenManager';
import { Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';

interface NotificationDropdownProps {
  role: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ role }) => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deduplication: Track received notification IDs to prevent duplicates
  const receivedIdsRef = useRef<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = async () => {
    if (!role || authLoading || !isAuthenticated) return;
    try {
      // Ensure access token exists in memory after page refresh.
      const inMemoryToken = getAccessToken() || await refreshAccessToken();
      if (!inMemoryToken) {
        return;
      }

      const data = await fetchApi<{
        received_notifications?: AppNotification[];
        notifications?: {
          data?: AppNotification[];
        } | AppNotification[];
        data?: {
          received_notifications?: AppNotification[];
          notifications?: {
            data?: AppNotification[];
          } | AppNotification[];
        };
      }>(`/v1/${role}/notifications`);
      let fetchedNotifications: AppNotification[] = [];
      
      // Handle different response structures
      if (data.received_notifications) {
        fetchedNotifications = data.received_notifications;
      } else if (data.notifications) {
        // Handle paginated response { notifications: { data: [...] } }
        if (typeof data.notifications === 'object' && 'data' in data.notifications && Array.isArray(data.notifications.data)) {
          fetchedNotifications = data.notifications.data;
        } else if (Array.isArray(data.notifications)) {
          fetchedNotifications = data.notifications;
        }
      } else if (data.data && data.data.received_notifications) {
        fetchedNotifications = data.data.received_notifications;
      } else if (data.data && data.data.notifications) {
         // Handle nested data structure
         if (typeof data.data.notifications === 'object' && 'data' in data.data.notifications && Array.isArray(data.data.notifications.data)) {
            fetchedNotifications = data.data.notifications.data;
         } else if (Array.isArray(data.data.notifications)) {
            fetchedNotifications = data.data.notifications;
         }
      }

      const newUnreadCount = (fetchedNotifications || []).filter(n => !n.read_at).length;
      
      // Play sound and show notification if unread count increased, but NOT on first load
      if (newUnreadCount > prevUnreadCountRef.current && !isFirstLoadRef.current) {
        try {
          audioRef.current?.play().catch(() => {});
          
          const newestNotification = fetchedNotifications[0];
          if (newestNotification) {
            const title = newestNotification.data.title || 'إشعار جديد';
            const body = newestNotification.data.message || '';

            // Try to show native notification first
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, {
                body: body,
                icon: '/logo.png',
                dir: 'rtl'
              });
            } else {
              // Fallback to toast if native notifications are not granted
              toast.success(title, {
                duration: 4000,
                position: 'top-center',
                style: {
                  background: '#333',
                  color: '#fff',
                  direction: 'rtl',
                },
                icon: '🔔',
              });
            }
          }
        } catch (err) {
        }
      }
      
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
      
      prevUnreadCountRef.current = newUnreadCount;
      setNotifications(fetchedNotifications || []);
      setUnreadCount(newUnreadCount);
    } catch (error) {
    }
  };

  useEffect(() => {
    if (role && !authLoading && isAuthenticated) {
      // Initial fetch
      fetchNotifications();

      // Get user ID and token for WebSocket
      const getUserData = () => {
        try {
          const storedUser = localStorage.getItem('user');
          const token = getAccessToken();
          if (storedUser && token) {
            const user = JSON.parse(storedUser);
            return { userId: user.id, token };
          }
        } catch (e) {
        }
        return null;
      };

      const userData = getUserData();


      // Setup Reverb WebSocket connection for real-time updates
      let echoCleanup: (() => void) | null = null;

      if (userData) {
        import('@/lib/echo').then(({ initializeEcho }) => {
          try {

            const echo = initializeEcho(userData.token);
            const channelName = `notifications.${role}.${userData.userId}`;
            

            
            const channel = echo.private(channelName);
            
            // First check connection
            channel.subscribed(() => {

            });
            
            channel.error((error: any) => {
              // Suppress 403 errors (unauthorized/suspended)
              if (error?.status === 403 || error?.error?.data?.code === 403) {
                return;
              }
            });
            
              // Listen for the event
              channel.listen('.new.notification', (data: any) => {

              
              const notificationId = data.notification_id || Date.now().toString();
              
              // Deduplication: Skip if already received
              if (receivedIdsRef.current.has(notificationId)) {
                return;
              }
              receivedIdsRef.current.add(notificationId);
              
              // Clean up old IDs after 5 minutes to prevent memory leak
              setTimeout(() => {
                receivedIdsRef.current.delete(notificationId);
              }, 5 * 60 * 1000);

              // Dispatch event for other components (like NotificationsSection)
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('notification:reverb:received', { 
                  detail: data 
                }));
              }
              
              const newNotification: AppNotification = {
                id: notificationId,
                type: data.type || 'general',
                data: {
                  title: data.title,
                  message: data.message,
                  sender_name: data.data?.sender_name,
                  ...data.data
                },
                read_at: null,
                created_at: data.created_at || new Date().toISOString()
              };

              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Play sound
              try {
                audioRef.current?.play().catch(() => {});
              } catch (err) {
              }
              
              // Show native notification or toast
              const title = data.title || 'إشعار جديد';
              const body = data.message || '';
              
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                  body: body,
                  icon: '/logo.png',
                  dir: 'rtl'
                });
              } else {
                toast.success(title, {
                  duration: 4000,
                  position: 'top-center',
                  style: {
                    background: '#333',
                    color: '#fff',
                    direction: 'rtl',
                  },
                  icon: '🔔',
                });
              }
            });

            echoCleanup = () => {

              echo.leave(channelName);
            };
          } catch (e) {
          }
        });
      }

      // Listen for FCM notifications from AuthContext (as fallback)
      const handleNewNotification = (event: Event) => {
        const customEvent = event as CustomEvent;
        const payload = customEvent.detail;
        

        
        if (payload && payload.data) {
          const newNotification: AppNotification = {
            id: (payload.data.notification_id || payload.data.id || Date.now()).toString(),
            type: payload.data.type || 'general',
            data: {
              title: payload.notification?.title || payload.data.title,
              message: payload.notification?.body || payload.data.message,
              sender_name: payload.data.sender_name,
              ...payload.data
            },
            read_at: null,
            created_at: new Date().toISOString()
          };

          // Check for duplicate (deduplication)
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotification.id);
            if (exists) {
              return prev;
              return prev;
            }
            return [newNotification, ...prev];
          });
          
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          try {
             audioRef.current?.play().catch(() => {});
          } catch (err) {
          }
        } else {
            fetchNotifications();
        }
      };

      window.addEventListener('notification:received', handleNewNotification);

      return () => {
        window.removeEventListener('notification:received', handleNewNotification);
        if (echoCleanup) {
          echoCleanup();
        }
      };
    }
  }, [role, authLoading, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await fetchApi(`/v1/${role}/notifications/${id}/read`, {
        method: 'POST'
      });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="navbar-user" ref={dropdownRef}>
      <div 
        className="navbar-user-clickable notification-trigger-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          // Try to play sound on interaction to unlock audio context for future notifications
          if (audioRef.current) {
            audioRef.current.volume = 0; // Silent play
            audioRef.current.play().then(() => {
              if (audioRef.current) audioRef.current.volume = 1; // Restore volume
            }).catch(() => {});
          }
        }}
      >
        <Icon name="bell" className="notification-trigger-icon" />
        {unreadCount > 0 && (
          <span className="navbar-badge notification-count-badge">
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          
          <div className="navbar-dropdown notification-dropdown">
            <div className="notification-dropdown-header">
              <h3 className="notification-dropdown-title">الإخطارات</h3>
              {unreadCount > 0 && (
                <span className="notification-dropdown-unread">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            
            <div className="notification-dropdown-list">
              {notifications.length === 0 ? (
                <div className="notification-dropdown-empty">
                  <i className="fas fa-inbox notification-dropdown-empty-icon"></i>
                  لا توجد إخطارات
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`notification-dropdown-item ${!notification.read_at ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-dropdown-content">
                      <div className={`notification-dropdown-dot ${!notification.read_at ? 'unread' : ''}`}></div>
                      <div className="notification-dropdown-main">
                        <h4 className={`notification-dropdown-item-title ${!notification.read_at ? 'unread' : ''}`}>
                          {notification.data.title}
                        </h4>
                        <p className="notification-dropdown-item-message">
                          {notification.data.message}
                        </p>
                        <div className="notification-dropdown-meta">
                          <span className="notification-dropdown-date">
                            {new Date(notification.created_at).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="notification-dropdown-tags">
                            {notification.data.child_name && (
                              <span className="notification-dropdown-tag child-tag">
                                <i className="fas fa-user-graduate"></i>
                                {notification.data.child_name}
                              </span>
                            )}
                            {notification.data.sender_name && (
                              <span className="notification-dropdown-tag sender-tag">
                                {notification.data.sender_name}
                                {notification.data.sender_subject && ` - ${notification.data.sender_subject}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="notification-dropdown-footer">
              <Link 
                href={role === 'parent' ? '/parent/children' : `/${role}/notifications`}
                className="notification-dropdown-link"
                onClick={() => setIsOpen(false)}
              >
                عرض كل الإخطارات
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
