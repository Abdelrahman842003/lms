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

import { Button, Icon, FormModal, Input, Textarea, Select } from '@/components/ui';

type TargetType = 'teachers' | 'secretaries' | 'all';

type RecipientOption = {
  id: string;
  name: string;
  is_active?: boolean;
};

const extractRows = (payload: any): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const rows =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.data?.data) && payload.data.data) ||
    (Array.isArray(payload?.data?.notifications?.data) && payload.data.notifications.data) ||
    (Array.isArray(payload?.notifications?.data) && payload.notifications.data) ||
    (Array.isArray(payload?.data?.teachers?.data) && payload.data.teachers.data) ||
    (Array.isArray(payload?.teachers?.data) && payload.teachers.data) ||
    (Array.isArray(payload?.data?.secretaries?.data) && payload.data.secretaries.data) ||
    (Array.isArray(payload?.secretaries?.data) && payload.secretaries.data) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.notifications) && payload.notifications) ||
    (Array.isArray(payload?.teachers) && payload.teachers) ||
    (Array.isArray(payload?.secretaries) && payload.secretaries) ||
    [];

  return Array.isArray(rows) ? rows : [];
};

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<RecipientOption[]>([]);
  const [secretaries, setSecretaries] = useState<RecipientOption[]>([]);
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_type: 'all' as TargetType,
    target_id: '',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchNotifications = async () => {
    try {
      const response = await academyService.getNotifications(1, 50);
      const rows = extractRows(response);

      if (rows.length > 0 || response) {
        setNotifications(rows);
      } else {
        console.warn('Unknown notifications response shape:', response);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      toast.error('تعذر تحميل سجل الإشعارات');
    }
  };

  const fetchRecipients = async () => {
    try {
      setIsRecipientsLoading(true);

      const [teachersResult, secretariesResult] = await Promise.allSettled([
        academyService.getTeachers(1, 200, '', ''),
        academyService.getSecretaries(1, 200, ''),
      ]);

      const teacherRows =
        teachersResult.status === 'fulfilled'
          ? extractRows(teachersResult.value)
          : [];
      const secretaryRows =
        secretariesResult.status === 'fulfilled'
          ? extractRows(secretariesResult.value)
          : [];

      setTeachers(
        teacherRows
          .filter((teacher: any) => teacher?.id)
          .filter((teacher: any) => teacher?.is_active !== false)
          .map((teacher: any) => ({
            id: teacher.id,
            name: teacher.name ?? 'بدون اسم',
            is_active: teacher.is_active,
          }))
      );

      setSecretaries(
        secretaryRows
          .filter((secretary: any) => secretary?.id)
          .filter((secretary: any) => secretary?.is_active !== false)
          .map((secretary: any) => ({
            id: secretary.id,
            name: secretary.name ?? 'بدون اسم',
            is_active: secretary.is_active,
          }))
      );

      if (teachersResult.status === 'rejected') {
        console.error('Failed to fetch teachers', teachersResult.reason);
      }

      if (secretariesResult.status === 'rejected') {
        console.error('Failed to fetch secretaries', secretariesResult.reason);
      }

      if (teachersResult.status === 'rejected' && secretariesResult.status === 'rejected') {
        toast.error('تعذر تحميل قائمة المستلمين');
      }
    } catch (error) {
      console.error('Failed to fetch recipients', error);
      toast.error('تعذر تحميل قائمة المستلمين');
    } finally {
      setIsRecipientsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userType === 'academy') {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (showCreateModal && user?.userType === 'academy') {
      fetchRecipients();
    }
  }, [showCreateModal, user]);

  const handleTargetTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      target_type: value as TargetType,
      target_id: '',
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetId =
        formData.target_type === 'all' || formData.target_id === ''
          ? undefined
          : formData.target_id;

      const response = await academyService.createNotification({
        ...formData,
        target_id: targetId,
        type: 'info',
      });

      const payload = response?.data ?? response;
      const created =
        payload?.data?.notification ||
        payload?.notification ||
        payload?.data?.data ||
        payload?.data ||
        null;

      if (created?.id) {
        setNotifications((prev) => [created, ...prev]);
      }

      toast.success('تم إرسال الإشعار بنجاح');
      setShowCreateModal(false);
      setFormData({
        title: '',
        message: '',
        target_type: 'all',
        target_id: '',
      });
      await fetchNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في إرسال الإشعار');
    }
  };

  if (!authLoading && (!user || user.userType !== 'academy')) return null;

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

  const selectedRecipientOptions =
    formData.target_type === 'teachers'
      ? teachers
      : formData.target_type === 'secretaries'
      ? secretaries
      : [];

  const allRecipientsLabel =
    formData.target_type === 'teachers' ? 'كل المدرسين' : 'كل السكرتيرات';

  return (
    <DashboardLayout role="academy" user={user || { name: 'الأكاديمية' }}>
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
              onChange={handleTargetTypeChange}
              placeholder="اختر الفئة المستهدفة"
            />
          </div>

          {formData.target_type !== 'all' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">مستلم محدد (اختياري)</label>
              <Select
                options={[
                  { value: '', label: allRecipientsLabel },
                  ...selectedRecipientOptions.map((recipient) => ({
                    value: recipient.id,
                    label: recipient.name,
                  })),
                ]}
                value={formData.target_id}
                onChange={(value) => setFormData({ ...formData, target_id: value })}
                placeholder="اختر مستلمًا محددًا"
                disabled={isRecipientsLoading}
                searchable
              />
            </div>
          )}
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
