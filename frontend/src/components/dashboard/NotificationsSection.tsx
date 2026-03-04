import React, { useEffect, useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { fetchApi } from '@/services/authService';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';
import { sendNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import { getAccessToken } from '@/lib/tokenManager';
import { Button, Icon } from '@/components/ui';

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
    setToken(getAccessToken());
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
      toast.error('فشل إرسال الرسالة');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return (
    <DashboardCard title="الإشعارات" icon="fas fa-bell">
      <div className="ux-animate-pulse ux-space-y-4">
        <div className="ux-h-20 ux-bg-white-5 ux-rounded-lg"></div>
        <div className="ux-h-20 ux-bg-white-5 ux-rounded-lg"></div>
      </div>
    </DashboardCard>
  );

  return (
    <>
      <DashboardCard 
        title="الإشعارات" 
        icon="fas fa-bell"
        action={
          <Button
            variant="ghost"
            onClick={() => {
              setFormData(prev => ({ ...prev, recipient_type: 'admin' }));
              setShowSupportModal(true);
            }}
            className="ux-px-3 ux-py-1dot5 ux-bg-primary-10 ux-hover-bg-primary-20 ux-text-primary ux-rounded-lg ux-text-sm ux-font-medium ux-transition-colors ux-flex ux-items-center ux-gap-2"
          >
            <Icon name="headset" />
            <span>تواصل مع الدعم</span>
          </Button>
        }
      >
        <div className="ux-space-y-4 ux-max-h-500px ux-overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="ux-text-center ux-py-8 ux-text-gray-400">
              <Icon name="bell-slash" className="ux-text-2xl ux-mb-2" />
              <p>لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isVoice = notification.is_voice || notification.message.includes('[رسالة صوتية]');
              
              return (
                <div
                  key={notification.id}
                  className={`ux-p-4 ux-rounded-lg ux-border ux-transition-all ux-cursor-pointer ${
                    notification.read_at
                      ? 'ux-bg-white-5 ux-border-white-5 ux-hover-bg-white-10'
                      : 'ux-bg-primary-10 ux-border-primary-20 ux-hover-bg-primary-20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="ux-flex ux-justify-between ux-items-start ux-mb-2">
                    <div className="ux-flex ux-items-center ux-gap-2">
                      {!notification.read_at && (
                        <span className="ux-w-2 ux-h-2 ux-rounded-full ux-bg-primary ux-animate-pulse"></span>
                      )}
                      <h4 className={`ux-font-bold ${notification.read_at ? 'ux-text-gray-light' : 'ux-text-white'}`}>
                        {notification.title}
                      </h4>
                    </div>
                    <span className="ux-text-xs ux-text-gray-500" dir="ltr">
                      {new Date(notification.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  
                  {isVoice ? (
                    <div className="ux-flex ux-items-center ux-gap-2 ux-text-primary ux-mb-3">
                      <Icon name="microphone" />
                      <span className="ux-text-sm">رسالة صوتية</span>
                    </div>
                  ) : (
                    <p className="ux-text-gray-400 ux-text-sm ux-mb-3 ux-leading-relaxed ux-line-clamp-2">{notification.message}</p>
                  )}

                  <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                    <span className="ux-text-primary ux-opacity-80 ux-font-medium">{notification.sender_name}</span>
                    <span className="ux-bg-white-10 ux-px-2 ux-py-1 ux-rounded-full ux-text-gray-400">
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
        <div className="ux-fixed ux-inset-0 ux-bg-black-50 ux-flex ux-items-center ux-justify-center ux-z-50 ux-p-4" onClick={() => setShowSupportModal(false)}>
          <div className="ux-bg-1e1e2d ux-rounded-xl ux-w-full ux-max-w-600px ux-shadow-xl ux-border ux-border-white-10" onClick={(e) => e.stopPropagation()}>
            <div className="ux-flex ux-justify-between ux-items-center ux-p-6 ux-border-b ux-border-white-10">
              <h3 className="ux-text-xl ux-font-bold ux-text-white ux-m-0">إرسال رسالة للدعم الفني / المطور</h3>
              <Button variant="ghost" className="ux-text-gray-400 ux-hover-text-white ux-transition-colors ux-bg-transparent ux-border-none ux-cursor-pointer ux-text-xl" onClick={() => setShowSupportModal(false)}>
                <Icon name="times" />
              </Button>
            </div>
            <form onSubmit={handleSupportSubmit}>
              <div className="ux-p-6">
                <div className="ux-mb-4">
                  <label htmlFor="title" className="ux-block ux-text-gray-light ux-text-sm ux-mb-2 ux-font-medium">الموضوع</label>
                  <input
                    type="text"
                    id="title"
                    className="ux-w-full ux-px-4 ux-py-3 ux-bg-white-5 ux-border ux-border-white-10 ux-rounded-lg ux-text-white ux-focus-border-primary ux-focus-ring-1 ux-focus-ring-primary ux-focus-outline-none ux-transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="مثال: استفسار عن درجات الطالب"
                  />
                </div>
                
                <div className="ux-mb-4">
                  <label htmlFor="message" className="ux-block ux-text-gray-light ux-text-sm ux-mb-2 ux-font-medium">تفاصيل الرسالة</label>
                  <textarea
                    id="message"
                    className="ux-w-full ux-px-4 ux-py-3 ux-bg-white-5 ux-border ux-border-white-10 ux-rounded-lg ux-text-white ux-focus-border-primary ux-focus-ring-1 ux-focus-ring-primary ux-focus-outline-none ux-transition-all"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    rows={6}
                    placeholder="اكتب تفاصيل الرسالة هنا..."
                  />
                </div>
              </div>
              <div className="ux-flex ux-justify-end ux-gap-3 ux-p-6 ux-border-t ux-border-white-10 ux-bg-white-5 ux-rounded-b-xl">
                <Button type="button" variant="secondary" onClick={() => setShowSupportModal(false)} disabled={isSending}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" disabled={isSending}>
                  {isSending ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Icon name="paper-plane" />
                      <span>إرسال الرسالة</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
