'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Filter } from '@/components/Filter';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getNotifications, sendNotification, Notification as SentNotification, ReceivedNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';
import { Button, FormModal, Icon, Input } from '@/components/ui/index';

function StudentNotificationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [receivedNotifications, setReceivedNotifications] = useState<ReceivedNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
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
      render: (value: string, row: any) => {
        const isVoice = row.data?.is_voice || value.includes('[رسالة صوتية]');
        if (isVoice) {
          return (
            <span className="inline-flex items-center gap-2 text-primary">
              <Icon name="microphone" />
              <span>رسالة صوتية</span>
            </span>
          );
        }
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      },
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

  const handleRowClick = (row: any) => {
    setSelectedNotification(row);
    setShowDetailsModal(true);
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
            <Button
              onClick={() => {
                setFormData(prev => ({ ...prev, recipient_type: 'admin' }));
                setShowModal(true);
              }}
              variant="primary"
            >
              <Icon name="headset" className="ml-2" />
              <span>تواصل مع الدعم</span>
            </Button>
            
            <Filter
              options={[
                { value: 'received', label: 'الواردة (من المدرس/الإدارة)' },
                { value: 'sent_to_developer', label: 'المرسلة (للدعم الفني)' }
              ]}
              value={filter}
              onChange={(value) => setFilter(value as 'received' | 'sent_to_developer')}
              className="w-auto min-w-[220px]"
            />
          </div>
        }
      >
        <div className="hidden md:block">
          <DataTable
            columns={filter === 'received' ? receivedTableColumns : sentTableColumns}
            data={filteredData}
            searchable={true}
            pagination={true}
            itemsPerPage={10}
            onRowClick={handleRowClick}
          />
        </div>

        <div className="md:hidden flex flex-col gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <div 
                key={index} 
                className="p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleRowClick(item)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-base">{item.title}</h3>
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">{item.message}</p>
                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-white/5 pt-3 mt-2">
                  <span className="flex items-center gap-1">
                    {filter === 'received' ? (
                      <>
                        <Icon name="user" className="text-primary" />
                        <span>{(item as any).sender_name}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="paper-plane" className="text-info" />
                        <span>الدعم الفني</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))
          ) : (
             <div className="text-center p-8 text-gray-400 bg-white/5 rounded-xl border border-white/10">
               <Icon name="inbox" size="lg" className="mb-2 block opacity-50" />
               لا توجد إخطارات
             </div>
          )}
        </div>
      </DashboardCard>

      {/* Send Notification Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        title="إرسال رسالة للدعم الفني / المطور"
        isLoading={isLoading}
        submitText={isLoading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
      >
        <div className="space-y-4">
          <Input
            id="title"
            label="الموضوع"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, title: e.target.value})}
            placeholder="مثال: مشكلة في تشغيل الفيديو"
            required
          />
          
          <div>
            <label htmlFor="message" className="block text-gray-300 text-sm mb-2 font-medium">تفاصيل المشكلة</label>
            <textarea
              id="message"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              value={formData.message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, message: e.target.value})}
              required
              rows={6}
              placeholder="اكتب تفاصيل المشكلة هنا..."
            />
          </div>
        </div>
      </FormModal>

      {/* Notification Details Modal */}
      <NotificationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        notification={selectedNotification}
      />
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
