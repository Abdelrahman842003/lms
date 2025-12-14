'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, sendNotification, Notification as SentNotification, ReceivedNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';

function StudentNotificationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [receivedNotifications, setReceivedNotifications] = useState<ReceivedNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'admin',
  });

  const [filter, setFilter] = useState<'received' | 'sent_to_developer'>('received');

  const getFilteredData = () => {
    if (filter === 'received') {
      return (receivedNotifications || []).map(n => ({
        ...n,
        title: n.data?.title || 'بدون عنوان',
        message: n.data?.message || '',
        sender_name: n.data?.sender_name || 'النظام',
      }));
    }
    return (notifications || []).filter(n => n.recipient_type === 'admin');
  };

  const filteredData = getFilteredData();

  useEffect(() => {
    fetchNotifications();

    // Handle query params
    const view = searchParams.get('view');
    if (view) {
      if (view === 'sent') {
        setFilter('sent_to_developer');
      } else {
        setFilter('received');
      }
    }
  }, [searchParams]);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.notifications || []);
      setReceivedNotifications(response.received_notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setReceivedNotifications([]);
    }
  };

  const sentTableColumns = [
    {
      key: 'title',
      label: 'العنوان',
      sortable: true,
    },
    {
      key: 'message',
      label: 'الرسالة',
      sortable: false,
      render: (value: string) => value.length > 50 ? value.substring(0, 50) + '...' : value,
    },
    {
      key: 'recipient_type',
      label: 'المستقبل',
      sortable: true,
      render: () => 'الدعم الفني / المطور',
    },
    {
      key: 'created_at',
      label: 'تاريخ الإرسال',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const receivedTableColumns = [
    {
      key: 'title',
      label: 'العنوان',
      sortable: true,
      render: (value: string) => value,
    },
    {
      key: 'message',
      label: 'الرسالة',
      sortable: false,
      render: (value: string) => value.length > 50 ? value.substring(0, 50) + '...' : value,
    },
    {
      key: 'sender_name',
      label: 'المرسل',
      sortable: true,
      render: (value: string) => <span className="badge badge-primary">{value}</span>,
    },
    {
      key: 'created_at',
      label: 'تاريخ الاستلام',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendNotification({
        title: formData.title,
        message: formData.message,
        recipient_type: 'admin',
      });
      toast.success('تم إرسال الرسالة بنجاح');
      setShowModal(false);
      setFormData({
        title: '',
        message: '',
        recipient_type: 'admin',
      });
      fetchNotifications();
      setFilter('sent_to_developer'); // Switch to sent view to see the new message
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('فشل إرسال الرسالة');
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => {
    if (filter === 'received') {
      return {
        card1: {
          title: 'إجمالي الإخطارات المستلمة',
          value: receivedNotifications.length,
          icon: 'fas fa-inbox',
          color: 'primary'
        },
        card2: {
          title: 'الإخطارات غير المقروءة',
          value: receivedNotifications.filter(n => !n.read_at).length,
          icon: 'fas fa-envelope',
          color: 'warning'
        }
      };
    }

    // For sent notifications (to developer)
    const sentCount = (notifications || []).filter(n => n.recipient_type === 'admin').length;

    return {
      card1: {
        title: 'الرسائل المرسلة للدعم',
        value: sentCount,
        icon: 'fas fa-paper-plane',
        color: 'primary'
      },
      card2: {
        title: 'حالة التذاكر',
        value: sentCount > 0 ? 'نشط' : '-',
        icon: 'fas fa-ticket-alt',
        color: 'secondary'
      }
    };
  };

  const stats = getStats();

  return (
    <DashboardLayout
      role="student"
      user={user || undefined}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title={stats.card1.title}
          value={stats.card1.value}
          icon={stats.card1.icon}
          color={stats.card1.color}
        />
        <StatCard
          title={stats.card2.title}
          value={stats.card2.value}
          icon={stats.card2.icon}
          color={stats.card2.color}
        />
      </div>

      {/* Notifications Table */}
      <DashboardCard
        title="سجل الإخطارات والدعم"
        icon="fas fa-list"
        action={
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, recipient_type: 'admin' }));
                setShowModal(true);
              }} 
              className="btn btn-primary"
            >
              <i className="fas fa-headset"></i>
              <span>تواصل مع الدعم</span>
            </button>
            
            <select
              className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none w-auto min-w-[150px] cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'received' | 'sent_to_developer')}
            >
              <option value="received" className="bg-[#1a1f37]">الواردة (من المدرس/الإدارة)</option>
              <option value="sent_to_developer" className="bg-[#1a1f37]">المرسلة (للدعم الفني)</option>
            </select>
          </div>
        }
      >
        <DataTable
          columns={filter === 'received' ? receivedTableColumns : sentTableColumns}
          data={filteredData}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </DashboardCard>

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1e1e2d] rounded-xl w-full max-w-[600px] shadow-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">إرسال رسالة للدعم الفني / المطور</h3>
              <button className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xl" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
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
                    placeholder="مثال: مشكلة في تشغيل الفيديو"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-gray-light text-sm mb-2 font-medium">تفاصيل المشكلة</label>
                  <textarea
                    id="message"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    rows={6}
                    placeholder="اكتب تفاصيل المشكلة هنا..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/5 rounded-b-xl">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isLoading}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? (
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
    </DashboardLayout>
  );
}

export default function StudentNotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}>
      <StudentNotificationsContent />
    </Suspense>
  );
}
