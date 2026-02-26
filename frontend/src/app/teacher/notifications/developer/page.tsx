'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getNotifications, sendNotification, Notification as SentNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import { FormModal, Button, Icon } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export default function DeveloperNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'admin',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      // Filter for admin notifications only
      const adminNotifications = (response.notifications || []).filter((n: SentNotification) => 
        n.recipient_type === 'admin'
      );
      setNotifications(adminNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const totalNotifications = notifications.length;

  const tableColumns = [
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
      key: 'created_at',
      label: 'تاريخ الإرسال',
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
      toast.success('تم إرسال الرسالة للمطور بنجاح');
      setShowModal(false);
      setFormData({
        title: '',
        message: '',
        recipient_type: 'admin',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('فشل إرسال الرسالة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الرسائل المرسلة"
          value={totalNotifications}
          icon="fas fa-code"
          color="primary"
        />
      </div>

      {/* Notifications Table */}
      <DashboardCard
        title="سجل الرسائل"
        icon="fas fa-list"
        action={
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Icon name="paperPlane" />
            <span>إرسال رسالة للمطور</span>
          </Button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={notifications}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </DashboardCard>

      {/* Send Notification Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        title="إرسال رسالة للمطور"
        isLoading={isLoading}
        submitText={isLoading ? 'جاري الإرسال...' : 'إرسال الآن'}
        cancelText="إلغاء"
        maxWidth="600px"
      >
        <Input
          id="title"
          label="العنوان"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, title: e.target.value})}
          required
          placeholder="مثال: طلب تعديل، إبلاغ عن مشكلة..."
        />
        
        <Textarea
          id="message"
          label="الرسالة"
          value={formData.message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, message: e.target.value})}
          required
          rows={6}
          placeholder="اكتب تفاصيل رسالتك هنا..."
        />
      </FormModal>
    </DashboardLayout>
  );
}
