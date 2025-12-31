'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageTransition } from '@/components/shared/PageTransition';
import { fetchApi } from '@/services/authService';

interface Notification {
  id: string;
  child_id: string;
  child_name: string;
  title: string;
  message: string;
  type: string;
  sender_name: string;
  created_at: string;
  read_at: string | null;
}

export default function ParentNotificationsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi('/parent/notifications');
      setNotifications(data.notifications || []);
      setStats(data.stats || { total: 0, unread: 0 });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchApi(`/parent/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchApi('/parent/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read_at)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return 'fas fa-file-alt text-blue-400';
      case 'lecture':
        return 'fas fa-video text-green-400';
      case 'attendance':
        return 'fas fa-check-circle text-emerald-400';
      case 'grade':
        return 'fas fa-star text-yellow-400';
      case 'warning':
        return 'fas fa-exclamation-triangle text-red-400';
      default:
        return 'fas fa-bell text-primary';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <PageTransition>
      <DashboardLayout
        role="parent"
        user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
        title="الإشعارات"
      >
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">الإشعارات</h1>
              <p className="text-gray-400">
                {stats.unread > 0 ? `${stats.unread} إشعار جديد` : 'لا توجد إشعارات جديدة'}
              </p>
            </div>
            {stats.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-primary text-sm hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-[#1A1F2E] text-gray-400 hover:text-white'
              }`}
            >
              الكل ({stats.total})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-[#1A1F2E] text-gray-400 hover:text-white'
              }`}
            >
              غير مقروء ({stats.unread})
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read_at && handleMarkAsRead(notification.id)}
                  className={`bg-[#1A1F2E] rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-[#1F2537] ${
                    !notification.read_at ? 'border-r-4 border-primary' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Child Badge */}
                      <div className="mb-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          {notification.child_name}
                        </span>
                      </div>

                      <h3 className={`font-bold mb-1 ${notification.read_at ? 'text-gray-400' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{formatDate(notification.created_at)}</span>
                        {notification.sender_name && (
                          <>
                            <span>•</span>
                            <span>{notification.sender_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read_at && (
                      <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredNotifications.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-bell-slash text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {filter === 'unread' ? 'لا توجد إشعارات جديدة' : 'لا توجد إشعارات'}
                  </h3>
                  <p className="text-gray-400">
                    {filter === 'unread'
                      ? 'جميع الإشعارات مقروءة'
                      : 'ستظهر هنا إشعارات أبنائك'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
