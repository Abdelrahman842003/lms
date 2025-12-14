'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { getGrades, Grade } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
import { getNotifications, sendNotification, Notification as SentNotification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';

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
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <i className="fas fa-paper-plane"></i>
            <span>إرسال إخطار للطلاب</span>
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

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[600px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">إرسال إخطار للطلاب</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300">العنوان</label>
                  <input
                    type="text"
                    id="title"
                    className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    rows={4}
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="recipient_type" className="block text-sm font-medium text-gray-300">المستقبلين</label>
                  <select
                    id="recipient_type"
                    className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none"
                    value={formData.recipient_type}
                    onChange={(e) => setFormData({...formData, recipient_type: e.target.value, grade_id: '', group_id: ''})}
                  >
                    <option value="all" className="bg-[#1a1f37]">جميع الطلاب</option>
                    <option value="grade" className="bg-[#1a1f37]">صف دراسي معين</option>
                    <option value="group" className="bg-[#1a1f37]">مجموعة معينة</option>
                  </select>
                </div>

                {formData.recipient_type === 'grade' && (
                  <div className="space-y-2">
                    <label htmlFor="grade_id" className="block text-sm font-medium text-gray-300">اختر الصف</label>
                    <select
                      id="grade_id"
                      className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none"
                      value={formData.grade_id}
                      onChange={(e) => setFormData({...formData, grade_id: e.target.value})}
                      required
                    >
                      <option value="" className="bg-[#1a1f37]">-- اختر الصف --</option>
                      {grades.map((grade) => (
                        <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                          {grade.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.recipient_type === 'group' && (
                  <div className="space-y-2">
                    <label htmlFor="group_id" className="block text-sm font-medium text-gray-300">اختر المجموعة</label>
                    <select
                      id="group_id"
                      className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none"
                      value={formData.group_id}
                      onChange={(e) => setFormData({...formData, group_id: e.target.value})}
                      required
                    >
                      <option value="" className="bg-[#1a1f37]">-- اختر المجموعة --</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id} className="bg-[#1a1f37]">
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
                <button 
                  type="button" 
                  className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all duration-200 font-medium" 
                  onClick={() => setShowModal(false)} 
                  disabled={isLoading}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>إرسال الآن</span>
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
