'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import * as academyService from '@/services/academyService';
import toast from 'react-hot-toast';

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
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
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
          icon="fas fa-paper-plane" 
          color="primary" 
        />
        <StatCard 
          title="إشعارات اليوم" 
          value={notifications.filter(n => {
            const today = new Date().toDateString();
            const nDate = new Date(n.created_at).toDateString();
            return today === nDate;
          }).length} 
          icon="fas fa-calendar-day" 
          color="secondary" 
        />
      </div>

      {/* Notifications List */}
      <DashboardCard
        title="سجل الإشعارات"
        icon="fas fa-list"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <i className="fas fa-paper-plane"></i>
            <span>إرسال إشعار جديد</span>
          </button>
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
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="w-full max-w-[520px] bg-[#1a1a28] rounded-2xl shadow-2xl border border-white/10 animate-scaleIn max-h-[85vh] overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-white">إرسال إشعار جديد</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" 
                onClick={() => setShowCreateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300">العنوان</label>
                  <input
                    type="text"
                    id="title"
                    className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="مثال: تنبيه هام"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300">الرسالة</label>
                  <textarea
                    id="message"
                    className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[120px] resize-y"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">الفئة المستهدفة</label>
                  <div className="relative">
                    <select
                      value={formData.target_type}
                      onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                      className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">الجميع</option>
                      <option value="teachers">المدرسين</option>
                      <option value="secretaries">السكرتيرات</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <i className="fas fa-chevron-down"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10 bg-black/30 shrink-0">
                <button 
                  type="button" 
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all font-medium" 
                  onClick={() => setShowCreateModal(false)}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all font-medium flex items-center gap-2"
                >
                  <i className="fas fa-paper-plane"></i>
                  <span>إرسال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
