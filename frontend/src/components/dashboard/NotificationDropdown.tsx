'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { ReceivedNotification as AppNotification } from '@/services/notificationService';

interface NotificationDropdownProps {
  role: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ role }) => {
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
    if (!role) return;
    try {
      const data = await fetchApi(`/${role}/notifications`);
      let fetchedNotifications: AppNotification[] = [];
      
      // Handle different response structures
      if (data.received_notifications) {
        fetchedNotifications = data.received_notifications;
      } else if (data.notifications) {
        // If backend returns 'notifications' (sent style), we might need to map them or treat them as received
        // For now assuming they are compatible or casting
        fetchedNotifications = data.notifications as unknown as AppNotification[];
      } else if (data.data && data.data.received_notifications) {
        fetchedNotifications = data.data.received_notifications;
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
                position: 'top-left',
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
          console.error('Error playing notification sound:', err);
        }
      }
      
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
      
      prevUnreadCountRef.current = newUnreadCount;
      setNotifications(fetchedNotifications || []);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (role) {
      // Initial fetch
      fetchNotifications();

      // Get user ID and token for WebSocket
      const getUserData = () => {
        try {
          const storedUser = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          if (storedUser && token) {
            const user = JSON.parse(storedUser);
            return { userId: user.id, token };
          }
        } catch (e) {
          console.error('Failed to get user data for WebSocket:', e);
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
                console.warn('[NotificationDropdown] Channel auth failed (403). User might be suspended or logged out.');
                return;
              }
              console.error('[NotificationDropdown] ❌ Channel error:', error);
            });
            
            // Listen for the event
            channel.listen('.new.notification', (data: any) => {

              
              const notificationId = data.notification_id || Date.now().toString();
              
              // Deduplication: Skip if already received
              if (receivedIdsRef.current.has(notificationId)) {
                return;
                return;
              }
              receivedIdsRef.current.add(notificationId);
              
              // Clean up old IDs after 5 minutes to prevent memory leak
              setTimeout(() => {
                receivedIdsRef.current.delete(notificationId);
              }, 5 * 60 * 1000);
              
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
                console.error('Error playing notification sound:', err);
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
                  position: 'top-left',
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
            console.error('[NotificationDropdown] Failed to setup Reverb:', e);
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
            console.error('Error playing notification sound:', err);
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
  }, [role]);

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
      await fetchApi(`/${role}/notifications/${id}/read`, {
        method: 'POST'
      });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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
        className="navbar-user-clickable notification-trigger"
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
        style={{ position: 'relative', padding: '0.5rem' }}
      >
        <i className="fas fa-bell" style={{ fontSize: '1.2rem', color: 'var(--gray-light)' }}></i>
        {unreadCount > 0 && (
          <span className="navbar-badge" style={{ 
            position: 'absolute', 
            top: '0', 
            right: '0',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--danger)',
            color: 'var(--white)',
            borderRadius: '50%'
          }}>
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <>
          {/* Full screen blur overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.72)',
              // backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 998,
              cursor: 'default'
            }}
            onClick={() => setIsOpen(false)}
          />
          
          <div className="navbar-dropdown notification-dropdown" style={{ 
            width: '500px',
            maxWidth: '90vw', 
            padding: '0', 
            left: '50%', 
            top: '80px',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 128, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            position: 'fixed'
          }}>
            <div style={{ 
              padding: '1.25rem', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent)'
            }}>
              <h3 style={{ fontWeight: '700', color: '#ffffff', margin: 0, fontSize: '1.1rem' }}>الإخطارات</h3>
              {unreadCount > 0 && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#ffffffff', 
                  backgroundColor: 'var(--primary)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontWeight: '600',
                  boxShadow: '0 2px 5px rgba(66, 99, 235, 0.4)'
                }}>
                  {unreadCount} جديد
                </span>
              )}
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                  لا توجد إخطارات
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                      cursor: 'pointer',
                      backgroundColor: !notification.read_at ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notification.read_at ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ 
                        marginTop: '0.25rem', 
                        width: '0.5rem', 
                        height: '0.5rem', 
                        borderRadius: '50%', 
                        flexShrink: 0,
                        backgroundColor: !notification.read_at ? 'var(--primary)' : 'rgba(255, 255, 255, 0.3)' 
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: !notification.read_at ? '700' : '400', 
                          color: '#ffffff',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {notification.data.title}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {notification.data.message}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {new Date(notification.created_at).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {notification.data.sender_name && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              color: 'var(--secondary)', 
                              backgroundColor: 'rgba(0, 214, 143, 0.1)', 
                              padding: '0.125rem 0.375rem', 
                              borderRadius: '0.25rem' 
                            }}>
                              {notification.data.sender_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <Link 
                href={`/${role}/notifications`}
                style={{ fontSize: '0.85rem', color: '#ffffff', textDecoration: 'none', fontWeight: '600' }}
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
