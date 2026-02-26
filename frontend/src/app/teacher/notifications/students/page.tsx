'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGrades, Grade } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
import { getNotifications, sendNotification, Notification as SentNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import { FormModal, Button, Icon } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'all',
    grade_id: '',
    group_id: '',
  });

  useEffect(() => {
    fetchGrades();
    fetchGroups();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      // Filter for student notifications only
      const studentNotifications = (response.notifications || []).filter((n: SentNotification) => 
        ['all', 'grade', 'group'].includes(n.recipient_type)
      );
      setNotifications(studentNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await getGrades();
      setGrades(response.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const totalNotifications = notifications.length;
  const totalSent = notifications.reduce((acc, curr) => acc + curr.recipient_count, 0);

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
      key: 'recipient_type',
      label: 'نوع المستقبلين',
      sortable: true,
      render: (value: string) => {
        const types: {[key: string]: string} = {
          'all': 'جميع الطلاب',
          'grade': 'صف دراسي',
          'group': 'مجموعة',
        };
        return types[value] || value;
      }
    },
    {
      key: 'recipient_count',
      label: 'عدد المستقبلين',
      sortable: true,
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
        recipient_type: formData.recipient_type as any,
        grade_id: formData.grade_id ? parseInt(formData.grade_id) : undefined,
        group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
      });
      toast.success('تم إرسال الإخطار بنجاح');
      setShowModal(false);
      setFormData({
        title: '',
        message: '',
        recipient_type: 'all',
        grade_id: '',
        group_id: '',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('فشل إرسال الإخطار');
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
          title="إجمالي الإخطارات"
          value={totalNotifications}
          icon="fas fa-bell"
          color="primary"
        />
        <StatCard
          title="إجمالي المستقبلين"
          value={totalSent}
          icon="fas fa-users"
          color="secondary"
        />
      </div>

      {/* Notifications Table */}
      <DashboardCard
        title="سجل إخطارات الطلاب"
        icon="fas fa-list"
        action={
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Icon name="paperPlane" />
            <span>إرسال إخطار للطلاب</span>
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
        title="إرسال إخطار للطلاب"
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
          placeholder="مثال: تنبيه هام"
        />

        <Textarea
          id="message"
          label="الرسالة"
          value={formData.message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, message: e.target.value})}
          required
          rows={4}
          placeholder="اكتب رسالتك هنا..."
        />

        <div className="space-y-2">
          <label htmlFor="recipient_type" className="block text-sm font-medium text-gray-300">المستقبلين</label>
          <Select
            options={[
              { value: 'all', label: 'جميع الطلاب' },
              { value: 'grade', label: 'صف دراسي معين' },
              { value: 'group', label: 'مجموعة معينة' }
            ]}
            value={formData.recipient_type}
            onChange={(value) => setFormData({...formData, recipient_type: value, grade_id: '', group_id: ''})}
            placeholder="اختر المستقبلين"
          />
        </div>

        {formData.recipient_type === 'grade' && (
          <div className="space-y-2">
            <label htmlFor="grade_id" className="block text-sm font-medium text-gray-300">اختر الصف</label>
            <Select
              options={grades.map((grade) => ({ value: grade.id, label: grade.name }))}
              value={formData.grade_id}
              onChange={(value) => setFormData({...formData, grade_id: value})}
              placeholder="-- اختر الصف --"
            />
          </div>
        )}

        {formData.recipient_type === 'group' && (
          <div className="space-y-2">
            <label htmlFor="group_id" className="block text-sm font-medium text-gray-300">اختر المجموعة</label>
            <Select
              options={groups.map((group) => ({ value: group.id, label: group.name }))}
              value={formData.group_id}
              onChange={(value) => setFormData({...formData, group_id: value})}
              placeholder="-- اختر المجموعة --"
            />
          </div>
        )}
      </FormModal>
    </DashboardLayout>
  );
}
