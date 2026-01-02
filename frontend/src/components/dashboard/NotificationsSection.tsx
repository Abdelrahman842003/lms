import React, { useEffect, useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { fetchApi } from '@/services/authService';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  type: string;
  sender_name: string;
  child_name: string;
}

export const NotificationsSection = () => {
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        
        const mapNotification = (n: any): Notification => ({
          id: n.id,
          title: n.data?.title || n.title || 'إشعار',
          message: n.data?.message || n.message || '',
          created_at: n.created_at,
          read_at: n.read_at,
          type: n.type || 'general',
          sender_name: n.data?.sender_name || n.sender_name || 'النظام',
          child_name: n.data?.child_name || n.child_name || ''
        });

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

        const newNotification: Notification = {
           id: data.notification_id || Date.now().toString(),
           title: data.title,
           message: data.message,
           created_at: data.created_at || new Date().toISOString(),
           read_at: null,
           type: data.type || 'general',
           sender_name: data.data?.sender_name,
           child_name: data.data?.child_name
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

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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
            notifications.map((notification) => (
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
                <p className="text-gray-400 text-sm mb-3 leading-relaxed line-clamp-2">{notification.message}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-primary/80 font-medium">{notification.sender_name}</span>
                  <span className="bg-white/10 px-2 py-1 rounded-full text-gray-400">
                    {notification.child_name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardCard>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNotification(null)}>
          <div 
            className="bg-[#1a1f37] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <i className="fas fa-bell text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedNotification.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(selectedNotification.created_at).toLocaleDateString('ar-EG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <i className="fas fa-user-graduate"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">الطالب</p>
                    <p className="text-sm font-bold text-white">{selectedNotification.child_name}</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">المرسل</p>
                    <p className="text-sm font-bold text-white">{selectedNotification.sender_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
