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

type RecipientSnapshot = {
  id: string;
  name: string;
  type?: string;
};

type RecipientsModalData = {
  label: string;
  count: number;
  recipients: RecipientSnapshot[];
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  target_type: string;
  recipient_count: number;
  recipient_snapshot: RecipientSnapshot[] | null;
  created_at: string;
  source: 'sent' | 'received';
  is_read?: boolean;
};

type GenericRecord = Record<string, unknown>;

type RecipientApiRow = {
  id?: string;
  name?: string;
  is_active?: boolean;
};

const asRecord = (value: unknown): GenericRecord | null => {
  if (typeof value === 'object' && value !== null) {
    return value as GenericRecord;
  }

  return null;
};

const extractRows = (payload: unknown): GenericRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is GenericRecord => typeof item === 'object' && item !== null);
  }

  const root = asRecord(payload);
  if (!root) return [];

  const rootData = asRecord(root.data);
  const rootDataData = asRecord(rootData?.data);
  const rootNotifications = asRecord(root.notifications);
  const rootTeachers = asRecord(root.teachers);
  const rootSecretaries = asRecord(root.secretaries);
  const rootDataNotifications = asRecord(rootData?.notifications);
  const rootDataTeachers = asRecord(rootData?.teachers);
  const rootDataSecretaries = asRecord(rootData?.secretaries);

  const rows =
    (Array.isArray(rootData) && rootData) ||
    (Array.isArray(rootDataData) && rootDataData) ||
    (Array.isArray(rootDataNotifications?.data) && rootDataNotifications.data) ||
    (Array.isArray(rootNotifications?.data) && rootNotifications.data) ||
    (Array.isArray(rootDataTeachers?.data) && rootDataTeachers.data) ||
    (Array.isArray(rootTeachers?.data) && rootTeachers.data) ||
    (Array.isArray(rootDataSecretaries?.data) && rootDataSecretaries.data) ||
    (Array.isArray(rootSecretaries?.data) && rootSecretaries.data) ||
    (Array.isArray(rootData) && rootData) ||
    (Array.isArray(root.notifications) && root.notifications) ||
    (Array.isArray(root.teachers) && root.teachers) ||
    (Array.isArray(root.secretaries) && root.secretaries) ||
    [];

  return Array.isArray(rows)
    ? rows.filter((item): item is GenericRecord => typeof item === 'object' && item !== null)
    : [];
};

const normalizeNotification = (row: GenericRecord, source: 'sent' | 'received'): NotificationRow => {
  const data = (row?.data as GenericRecord | undefined) ?? {};

  return {
    id: String(row?.id ?? `${source}-${Math.random().toString(36).slice(2)}`),
    title: String(row?.title ?? data?.title ?? 'بدون عنوان'),
    message: String(row?.message ?? data?.message ?? ''),
    target_type: String(row?.target_type ?? data?.target_type ?? (source === 'received' ? 'system' : 'all')),
    recipient_count: Number(row?.recipient_count ?? data?.recipient_count ?? 0),
    recipient_snapshot:
      (Array.isArray(row?.recipient_snapshot) ? row.recipient_snapshot : null) ??
      (Array.isArray(data?.recipient_snapshot) ? data.recipient_snapshot : null),
    created_at: String(row?.created_at ?? new Date().toISOString()),
    source,
    is_read: typeof row?.is_read === 'boolean' ? row.is_read : undefined,
  };
};

const extractNotificationRows = (payload: unknown): NotificationRow[] => {
  const root = (payload as GenericRecord | undefined) ?? {};
  const nestedData = (root.data as GenericRecord | undefined) ?? {};
  const deepData = (nestedData.data as GenericRecord | undefined) ?? {};

  const sentRows = extractRows(
    nestedData.notifications ?? root.notifications ?? deepData.notifications
  );
  const receivedRows = extractRows(
    nestedData.received_notifications ?? root.received_notifications ?? deepData.received_notifications
  );

  const merged = [
    ...sentRows.map((row) => normalizeNotification(row, 'sent')),
    ...receivedRows.map((row) => normalizeNotification(row, 'received')),
  ];

  const uniqueRows = Array.from(new Map(merged.map((row) => [row.id, row])).values());

  return uniqueRows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [teachers, setTeachers] = useState<RecipientOption[]>([]);
  const [secretaries, setSecretaries] = useState<RecipientOption[]>([]);
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'all' | 'specific'>('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientsModalData, setRecipientsModalData] = useState<RecipientsModalData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_type: 'all' as TargetType,
    target_ids: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchNotifications = async () => {
    try {
      const response = await academyService.getNotifications(1, 50);
      const rows = extractNotificationRows(response);

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
          .map((teacher) => teacher as RecipientApiRow)
          .filter((teacher) => Boolean(teacher.id))
          .filter((teacher) => teacher.is_active !== false)
          .map((teacher) => ({
            id: String(teacher.id),
            name: teacher.name ?? 'بدون اسم',
            is_active: teacher.is_active,
          }))
      );

      setSecretaries(
        secretaryRows
          .map((secretary) => secretary as RecipientApiRow)
          .filter((secretary) => Boolean(secretary.id))
          .filter((secretary) => secretary.is_active !== false)
          .map((secretary) => ({
            id: String(secretary.id),
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
      target_ids: [],
    }));
    setRecipientMode('all');
    setRecipientSearch('');
  };

  const handleRecipientToggle = (recipientId: string) => {
    setFormData((prev) => {
      const isSelected = prev.target_ids.includes(recipientId);
      const targetIds = isSelected
        ? prev.target_ids.filter((id) => id !== recipientId)
        : [...prev.target_ids, recipientId];

      return {
        ...prev,
        target_ids: targetIds,
      };
    });
  };

  const openRecipientsModal = (row: NotificationRow) => {
    const recipients = Array.isArray(row?.recipient_snapshot) ? row.recipient_snapshot : [];
    if (recipients.length === 0) return;

    const count = Number(row?.recipient_count ?? recipients.length ?? 0);
    setRecipientsModalData({
      label: getTargetLabel(row?.target_type),
      count,
      recipients: recipients as RecipientSnapshot[],
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.target_type !== 'all' && recipientMode === 'specific' && formData.target_ids.length === 0) {
        toast.error('اختر مستلمًا واحدًا على الأقل أو غيّر النوع إلى كل الفئة');
        return;
      }

      const response = await academyService.createNotification({
        title: formData.title,
        message: formData.message,
        target_type: formData.target_type,
        target_ids: formData.target_type !== 'all' && recipientMode === 'specific' ? formData.target_ids : undefined,
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
        setNotifications((prev) => [normalizeNotification(created, 'sent'), ...prev]);
      }

      toast.success('تم إرسال الإشعار بنجاح');
      setShowCreateModal(false);
      setFormData({
        title: '',
        message: '',
        target_type: 'all',
        target_ids: [],
      });
      setRecipientMode('all');
      setRecipientSearch('');
      await fetchNotifications();
    } catch (error: unknown) {
      const errorMessage: string =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل في إرسال الإشعار'
          : 'فشل في إرسال الإشعار';

      toast.error(errorMessage);
    }
  };

  if (!authLoading && (!user || user.userType !== 'academy')) return null;

  const getTargetLabel = (target: string) => {
    const labels: Record<string, string> = {
      teachers: 'المدرسين',
      secretaries: 'السكرتيرات',
      all: 'الجميع',
      system: 'الوارد من النظام',
    };
    return labels[target] || target;
  };

  const tableColumns = [
    { key: 'title', label: 'العنوان', sortable: true },
    { 
      key: 'message', 
      label: 'الرسالة', 
      sortable: false,
      render: (value: string) => {
        const text = value || '';
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
      }
    },
    {
      key: 'target_type',
      label: 'المستهدفين',
      sortable: true,
      render: (value: string, row: NotificationRow) => {
        const label = getTargetLabel(value);
        const recipientCount = Number(row?.recipient_count ?? 0);
        const snapshot = Array.isArray(row?.recipient_snapshot) ? row.recipient_snapshot : [];

        if (snapshot.length > 0) {
          return (
            <button
              type="button"
              className="badge badge-outline-info badge-clickable"
              onClick={() => openRecipientsModal(row)}
            >
              {label} ({recipientCount || snapshot.length})
            </button>
          );
        }

        if (recipientCount > 0 && value !== 'all') {
          return (
            <span className="badge badge-outline-info">
              {label} ({recipientCount})
            </span>
          );
        }

        return label;
      },
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

  const filteredRecipientOptions = selectedRecipientOptions.filter((recipient) =>
    recipient.name.toLowerCase().includes(recipientSearch.toLowerCase())
  );

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
              <label className="block text-sm font-medium text-gray-300">نوع التحديد</label>
              <Select
                options={[
                  { value: 'all', label: allRecipientsLabel },
                  { value: 'specific', label: 'تحديد مستلمين' },
                ]}
                value={recipientMode}
                onChange={(value) => {
                  const mode = value as 'all' | 'specific';
                  setRecipientMode(mode);
                  if (mode === 'all') {
                    setFormData((prev) => ({ ...prev, target_ids: [] }));
                  }
                }}
                disabled={isRecipientsLoading}
              />

              {recipientMode === 'specific' && (
                <>
                  <div className="ui-input-container">
                    <input
                      type="text"
                      className="form-input ux-w-full"
                      placeholder="بحث عن مستلم..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                  </div>

                  <div
                    className="rounded-xl border border-white/10 p-2 custom-scrollbar"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                  >
                    {filteredRecipientOptions.length === 0 ? (
                      <div className="text-sm text-gray-400 py-3 text-center">لا توجد نتائج</div>
                    ) : (
                      filteredRecipientOptions.map((recipient) => {
                        const checked = formData.target_ids.includes(recipient.id);
                        return (
                          <label
                            key={recipient.id}
                            className="flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer hover:bg-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleRecipientToggle(recipient.id)}
                            />
                            <span>{recipient.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    تم اختيار {formData.target_ids.length} مستلم
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </FormModal>

      {recipientsModalData && (
        <div className="modal-overlay" onClick={() => setRecipientsModalData(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>المستلمون المحددون</h3>
              <Button
                variant="ghost"
                size="sm"
                className="modal-close"
                onClick={() => setRecipientsModalData(null)}
                aria-label="إغلاق"
              >
                <Icon name="times" size="sm" />
              </Button>
            </div>

            <div className="modal-body">
              <div className="mb-3 text-sm text-gray-300">
                {recipientsModalData.label} - {recipientsModalData.count} مستلم
              </div>
              <div className="space-y-2 custom-scrollbar" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {recipientsModalData.recipients.map((recipient, index) => (
                  <div key={recipient.id} className="p-2 rounded-lg border border-white/10 flex items-center justify-between">
                    <span>{recipient.name || 'بدون اسم'}</span>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="outline" onClick={() => setRecipientsModalData(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
