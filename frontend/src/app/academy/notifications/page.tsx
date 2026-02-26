'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import * as academyService from '@/services/academyService';
import toast from 'react-hot-toast';

import { Button, Icon, LoadingSpinner, FormModal, Input, Textarea, Select } from '@/components/ui';
export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  // const [isLoading, setIsLoading] = useState(true); // Removed unused state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    // type: 'info', // Removed type
    target_type: 'all' as 'teachers' | 'secretaries' | 'all',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchNotifications = async () => {
    try {
      // setIsLoading(true);
      const response = await academyService.getNotifications(1, 50);
      setNotifications(response.data?.notifications?.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      // setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userType === 'academy') {
      fetchNotifications();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academyService.createNotification({
        ...formData,
        type: 'info',
      });
      toast.success('تم إرسال الإشعار بنجاح');
      setShowCreateModal(false);
      setFormData({
        title: '',
        message: '',
        target_type: 'all',
      });
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في إرسال الإشعار');
    }
  };

  if (authLoading || !user || user.userType !== 'academy') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="sm" color="primary" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const getTargetLabel = (target: string) => {
    const labels: any = {
      teachers: 'المدرسين',
      secretaries: 'السكرتيرات',
      all: 'الجميع',
    };
    return labels[target] || target;
  };

  const tableColumns = [
    { key: 'title', label: 'العنوان', sortable: true },
    { 
      key: 'message', 
      label: 'الرسالة', 
      sortable: false,
      render: (value: string) => value.length > 50 ? value.substring(0, 50) + '...' : value 
    },
    {
      key: 'target_type',
      label: 'المستهدفين',
      sortable: true,
      render: getTargetLabel,
    },
    { 
      key: 'created_at', 
      label: 'تاريخ الإرسال', 
      sortable: true, 
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG') 
    },
  ];

  return (
    <DashboardLayout role="academy" user={user}>
      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الإشعارات المرسلة"
          value={notifications.length}
          icon="paper-plane"
          color="primary"
        />
        <StatCard
          title="إشعارات اليوم"
          value={notifications.filter(n => {
            const today = new Date().toDateString();
            const nDate = new Date(n.created_at).toDateString();
            return today === nDate;
          }).length}
          icon="calendar-day"
          color="secondary"
        />
      </div>

      {/* Notifications List */}
      <DashboardCard
        title="سجل الإشعارات"
        icon="list"
        action={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Icon name="paper-plane" className="ml-2" />
            <span>إرسال إشعار جديد</span>
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

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        title="إرسال إشعار جديد"
        submitText="إرسال"
        cancelText="إلغاء"
        maxWidth="520px"
      >
        <div className="space-y-4">
          <Input
            id="title"
            label="العنوان"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="مثال: تنبيه هام"
          />

          <Textarea
            id="message"
            label="الرسالة"
            value={formData.message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={4}
            placeholder="اكتب رسالتك هنا..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">الفئة المستهدفة</label>
            <Select
              options={[
                { value: 'all', label: 'الجميع' },
                { value: 'teachers', label: 'المدرسين' },
                { value: 'secretaries', label: 'السكرتيرات' }
              ]}
              value={formData.target_type}
              onChange={(value) => setFormData({ ...formData, target_type: value as 'teachers' | 'secretaries' | 'all' })}
              placeholder="اختر الفئة المستهدفة"
            />
          </div>
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
