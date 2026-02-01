import React, { useEffect, useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { fetchApi } from '@/services/authService';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';
import { sendNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';

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
  
  // Support Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'admin',
  });

  useEffect(() => {
    // Get token from localStorage on mount
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await fetchApi<{
        received_notifications?: any[];
        notifications?: any[];
        data?: {
          received_notifications?: any[];
          notifications?: any[];
        };
      }>('/parent/notifications');
      
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

  useEffect(() => {
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

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await sendNotification({
        title: formData.title,
        message: formData.message,
        recipient_type: 'admin',
      });
      toast.success('تم إرسال الرسالة بنجاح');
      setShowSupportModal(false);
      setFormData({
        title: '',
        message: '',
        recipient_type: 'admin',
      });
      // Optionally refresh notifications if we want to show sent messages (but this section shows received)
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('فشل إرسال الرسالة');
    } finally {
      setIsSending(false);
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
      <DashboardCard 
        title="الإشعارات" 
        icon="fas fa-bell"
        action={
          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, recipient_type: 'admin' }));
              setShowSupportModal(true);
            }} 
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-headset"></i>
            <span>تواصل مع الدعم</span>
          </button>
        }
      >
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

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupportModal(false)}>
          <div className="bg-[#1e1e2d] rounded-xl w-full max-w-[600px] shadow-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">إرسال رسالة للدعم الفني / المطور</h3>
              <button className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xl" onClick={() => setShowSupportModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSupportSubmit}>
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-light text-sm mb-2 font-medium">الموضوع</label>
                  <input
                    type="text"
                    id="title"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="مثال: استفسار عن درجات الطالب"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-gray-light text-sm mb-2 font-medium">تفاصيل الرسالة</label>
                  <textarea
                    id="message"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    rows={6}
                    placeholder="اكتب تفاصيل الرسالة هنا..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/5 rounded-b-xl">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupportModal(false)} disabled={isSending}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSending}>
                  {isSending ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>إرسال الرسالة</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
