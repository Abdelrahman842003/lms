import React, { useEffect, useState } from 'react';
import { DashboardCard } from './DashboardCard';

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = await response.json();
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

      // Setup Reverb Listener
      import('@/lib/echo').then(({ initializeEcho }) => {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
             const user = JSON.parse(userStr);
             const echo = initializeEcho(token);
             const channelName = `notifications.parent.${user.id}`;
             
             echo.private(channelName)
               .listen('.new.notification', (data: any) => {
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
                 
                 setNotifications(prev => [newNotification, ...prev]);
               });
               
             return () => {
               echo.leave(channelName);
             };
          }
        } catch (e) {
          console.error('Failed to setup Reverb in NotificationsSection:', e);
        }
      });
    }
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
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
              onClick={() => !notification.read_at && markAsRead(notification.id)}
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
              <p className="text-gray-400 text-sm mb-3 leading-relaxed">{notification.message}</p>
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
  );
};
