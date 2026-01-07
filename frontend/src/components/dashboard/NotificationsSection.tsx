import React, { useEffect, useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { fetchApi } from '@/services/authService';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  type: string;
  sender_name: string;
  child_name: string;
  data?: any; // To store full data including voice info
  is_voice?: boolean;
  voice_url?: string;
  voice_path?: string;
  voice_duration?: number;
}

export const NotificationsSection = () => {
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Get token from localStorage on mount
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await fetchApi('/parent/notifications');
        
        // Handle different response structures
        let fetchedNotifications: Notification[] = [];
        
        const mapNotification = (n: any): Notification => {
          const notificationData = n.data || {};
          return {
            id: n.id,
            title: notificationData.title || n.title || 'إشعار',
            message: notificationData.message || n.message || '',
            created_at: n.created_at,
            read_at: n.read_at,
            type: n.type || 'general',
            sender_name: notificationData.sender_name || n.sender_name || 'النظام',
            child_name: notificationData.child_name || n.child_name || '',
            data: notificationData,
            is_voice: notificationData.is_voice || n.is_voice || false,
            voice_url: notificationData.voice_url || n.voice_url,
            voice_path: notificationData.voice_path || n.voice_path,
            voice_duration: notificationData.voice_duration || n.voice_duration
          };
        };

        if (data.received_notifications) {
          fetchedNotifications = data.received_notifications.map(mapNotification);
        } else if (data.data && data.data.received_notifications) {
          fetchedNotifications = data.data.received_notifications.map(mapNotification);
        } else if (data.notifications) {
           fetchedNotifications = data.notifications.map(mapNotification);
        }
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchNotifications();
      
      // Listen for Reverb events dispatched by NotificationDropdown
      const handleReverbNotification = (event: Event) => {
        const customEvent = event as CustomEvent;
        const data = customEvent.detail;
        
        console.log('NotificationsSection received event:', data); // DEBUG

        const notificationData = data.data || {};
        const newNotification: Notification = {
           id: data.notification_id || Date.now().toString(),
           title: data.title,
           message: data.message,
           created_at: data.created_at || new Date().toISOString(),
           read_at: null,
           type: data.type || 'general',
           sender_name: notificationData.sender_name,
           child_name: notificationData.child_name,
           data: notificationData,
           is_voice: notificationData.is_voice || data.is_voice,
           voice_url: notificationData.voice_url || data.voice_url,
           voice_path: notificationData.voice_path || data.voice_path,
           voice_duration: notificationData.voice_duration || data.voice_duration
        };
         
        setNotifications(prev => {
           // Prevent duplicates
           if (prev.some(n => n.id === newNotification.id)) return prev;
           return [newNotification, ...prev];
        });
      };

      window.addEventListener('notification:reverb:received', handleReverbNotification);
      
      return () => {
        window.removeEventListener('notification:reverb:received', handleReverbNotification);
      };
    }
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      await fetchApi(`/parent/notifications/${id}/read`, {
        method: 'POST'
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
  };

  if (isLoading) return (
    <DashboardCard title="الإشعارات" icon="fas fa-bell">
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-white/5 rounded-lg"></div>
        <div className="h-20 bg-white/5 rounded-lg"></div>
      </div>
    </DashboardCard>
  );

  return (
    <>
      <DashboardCard title="الإشعارات" icon="fas fa-bell">
        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <i className="fas fa-bell-slash text-2xl mb-2"></i>
              <p>لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isVoice = notification.is_voice || notification.message.includes('[رسالة صوتية]');
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    notification.read_at
                      ? 'bg-white/5 border-white/5 hover:bg-white/10'
                      : 'bg-primary/10 border-primary/20 hover:bg-primary/20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {!notification.read_at && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      )}
                      <h4 className={`font-bold ${notification.read_at ? 'text-gray-300' : 'text-white'}`}>
                        {notification.title}
                      </h4>
                    </div>
                    <span className="text-xs text-gray-500" dir="ltr">
                      {new Date(notification.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  
                  {isVoice ? (
                    <div className="flex items-center gap-2 text-primary mb-3">
                      <i className="fas fa-microphone"></i>
                      <span className="text-sm">رسالة صوتية</span>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mb-3 leading-relaxed line-clamp-2">{notification.message}</p>
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary/80 font-medium">{notification.sender_name}</span>
                    <span className="bg-white/10 px-2 py-1 rounded-full text-gray-400">
                      {notification.child_name}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DashboardCard>

      {/* Notification Details Modal */}
      <NotificationDetailsModal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
      />
    </>
  );
};
