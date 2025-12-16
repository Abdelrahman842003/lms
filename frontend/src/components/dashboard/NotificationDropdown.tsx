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


  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Using a hosted sound for reliability
    
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
          audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
          
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

      // Listen for real-time notifications from AuthContext
      const handleNewNotification = (event: Event) => {
        const customEvent = event as CustomEvent;
        const payload = customEvent.detail;
        
        console.log('NotificationDropdown received real-time event:', payload);
        
        // Construct a new notification object from the payload
        // Note: Payload structure depends on how backend sends it. 
        // Usually payload.data contains the data we need.
        if (payload && payload.data) {
          const newNotification: AppNotification = {
            id: (payload.data.id || Date.now()).toString(), // Ensure string ID
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

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          try {
             audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
          } catch (err) {
            console.error('Error playing notification sound:', err);
          }
        } else {
            // If payload structure is unclear, just refetch to be safe
            fetchNotifications();
        }
      };

      window.addEventListener('notification:received', handleNewNotification);

      return () => {
        window.removeEventListener('notification:received', handleNewNotification);
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
        onClick={() => setIsOpen(!isOpen)}
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
