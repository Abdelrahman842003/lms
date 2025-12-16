'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, sendNotification, Notification as SentNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'all_users', // Default to all users
  });

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user) {
      fetchNotifications();
    }
  }, [user, isLoading]);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendNotification({
        title: formData.title,
        message: formData.message,
        recipient_type: formData.recipient_type as any,
      });
      toast.success('تم إرسال الإخطار بنجاح');
      setShowModal(false);
      setFormData({
        title: '',
        message: '',
        recipient_type: 'all_users',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('فشل إرسال الإخطار');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (row: any) => {
    setSelectedNotification(row);
    setShowDetailsModal(true);
  };

  const tableColumns = [
    {
      key: 'title',
      label: 'العنوان',
      sortable: true,
      render: (value: string, row: any) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className="text-white hover:text-primary transition-colors font-medium text-right"
        >
          {value}
        </button>
      )
    },
    {
      key: 'message',
      label: 'الرسالة',
      sortable: false,
      className: 'hidden md:table-cell',
      render: (value: string) => value.length > 50 ? value.substring(0, 50) + '...' : value,
    },
    {
      key: 'recipient_type',
      label: 'المستقبلين',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (value: string) => {
        const types: {[key: string]: string} = {
          'all_users': 'جميع المستخدمين',
          'all_teachers': 'جميع المدرسين',
          'all_students': 'جميع الطلاب',
          'all_secretaries': 'جميع السكرتارية',
        };
        return types[value] || value;
      }
    },
    {
      key: 'created_at',
      label: 'تاريخ الإرسال',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={{
        name: user?.name || 'المدير',
        avatar: user?.avatar || '',
      }}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الإخطارات"
          value={notifications.length}
          icon="fas fa-bell"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="إخطارات هذا الشهر"
          value={notifications.filter(n => {
            const date = new Date(n.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}
          icon="fas fa-calendar-check"
          color="secondary"
          variant="centered"
        />
      </div>

      {/* Notifications Table */}
      <DashboardCard
        title="سجل الإخطارات المرسلة"
        icon="fas fa-list"
        action={
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <i className="fas fa-paper-plane"></i>
            <span>إرسال إخطار جديد</span>
          </button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={notifications}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
          onRowClick={handleRowClick}
        />
      </DashboardCard>

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1f37] p-5 rounded-2xl w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl text-white mb-4 font-bold">إرسال إخطار جديد</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-300 mb-1.5 text-sm">العنوان</label>
                <input
                  type="text"
                  id="title"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="عنوان الإخطار"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-gray-300 mb-1.5 text-sm">الرسالة</label>
                <textarea
                  id="message"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  rows={3}
                  placeholder="نص الرسالة..."
                />
              </div>

              <div className="mb-6">
                <label htmlFor="recipient_type" className="block text-gray-300 mb-1.5 text-sm">المستقبلين</label>
                <Select
                  options={[
                    { value: 'all_users', label: 'جميع المستخدمين' },
                    { value: 'all_teachers', label: 'جميع المدرسين' },
                    { value: 'all_students', label: 'جميع الطلاب' },
                    { value: 'all_secretaries', label: 'جميع السكرتارية' }
                  ]}
                  value={formData.recipient_type}
                  onChange={(value) => setFormData({...formData, recipient_type: value})}
                  className="w-full text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      <NotificationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        notification={selectedNotification}
      />
    </DashboardLayout>
  );
}
