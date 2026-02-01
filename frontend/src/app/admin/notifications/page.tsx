'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { 
  getNotifications, 
  sendNotification, 
  checkVoiceLimit,
  sendVoiceNotification,
  Notification as SentNotification, 
  ReceivedNotification 
} from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';
import VoiceRecorder from '@/components/notifications/VoiceRecorder';
import VoicePlayer from '@/components/notifications/VoicePlayer';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [receivedNotifications, setReceivedNotifications] = useState<ReceivedNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'sent' | 'received'>('sent');
  
  // Voice state
  const [notificationType, setNotificationType] = useState<'text' | 'voice'>('text');
  const [canSendVoice, setCanSendVoice] = useState(true);
  const [maxVoiceDuration, setMaxVoiceDuration] = useState(90);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'all_users',
  });

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user) {
      fetchNotifications();
      fetchVoiceLimit();
    }
  }, [user, isLoading]);

  const fetchVoiceLimit = async () => {
    try {
      const response = await checkVoiceLimit();
      setCanSendVoice(response.can_send_voice);
      setMaxVoiceDuration(response.max_duration);
    } catch (error) {
      // Admin has no limit, default to enabled
      setCanSendVoice(true);
      setMaxVoiceDuration(40);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.notifications || []);
      setReceivedNotifications(response.received_notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (notificationType === 'voice' && voiceBlob) {
        await sendVoiceNotification({
          title: formData.title,
          voice: voiceBlob,
          duration: voiceDuration,
          recipient_type: formData.recipient_type as any,
        });
        toast.success('تم إرسال الرسالة الصوتية بنجاح');
      } else {
        await sendNotification({
          title: formData.title,
          message: formData.message,
          recipient_type: formData.recipient_type as any,
        });
        toast.success('تم إرسال الإخطار بنجاح');
      }
      handleCloseModal();
      fetchNotifications();
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error(error.message || 'فشل إرسال الإخطار');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ title: '', message: '', recipient_type: 'all_users' });
    setNotificationType('text');
    setVoiceBlob(null);
    setVoiceDuration(0);
  };

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setVoiceBlob(blob);
    setVoiceDuration(duration);
  };

  const handleRowClick = (row: any) => {
    setSelectedNotification(row);
    setShowDetailsModal(true);
  };

  const sentTableColumns = [
    {
      key: 'title',
      label: 'العنوان',
      sortable: true,
      render: (value: string, row: any) => (
        <button 
          onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}
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
      render: (value: string, row: any) => {
        if (row.is_voice) {
          return (
            <span className="inline-flex items-center gap-2 text-blue-400">
              <i className="fas fa-microphone"></i>
              <span>رسالة صوتية</span>
            </span>
          );
        }
        return value?.length > 50 ? value.substring(0, 50) + '...' : value;
      },
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

  const receivedTableColumns = [
    {
      key: 'title',
      label: 'العنوان',
      sortable: true,
      render: (value: string, row: any) => (
        <button 
          onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}
          className="text-white hover:text-primary transition-colors font-medium text-right"
        >
          {value || 'بدون عنوان'}
        </button>
      )
    },
    {
      key: 'message',
      label: 'الرسالة',
      sortable: false,
      className: 'hidden md:table-cell',
      render: (value: string, row: any) => {
        if (row.is_voice || row.data?.is_voice) {
          return (
            <span className="inline-flex items-center gap-2 text-blue-400">
              <i className="fas fa-microphone"></i>
              <span>رسالة صوتية</span>
            </span>
          );
        }
        return value?.length > 50 ? value.substring(0, 50) + '...' : value;
      },
    },
    {
      key: 'sender_name',
      label: 'المرسل',
      sortable: true,
      render: (value: string, row: any) => (
        <span className="badge badge-secondary">
          {row.data?.sender_name || 'مستخدم'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'تاريخ الاستلام',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const getFilteredData = () => {
    if (filter === 'received') {
      return receivedNotifications.map(n => ({
        ...n,
        title: n.data?.title,
        message: n.data?.message,
        is_voice: n.data?.is_voice,
        voice_url: n.data?.voice_url || n.voice_url,
      }));
    }
    return notifications;
  };

  return (
    <DashboardLayout role="admin" user={{ name: user?.name || 'المدير', avatar: user?.avatar || '' }}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard title="إجمالي الإخطارات المرسلة" value={notifications.length} icon="fas fa-paper-plane" color="primary" variant="centered" />
        <StatCard title="رسائل الدعم الواردة" value={receivedNotifications.length} icon="fas fa-inbox" color="secondary" variant="centered" />
      </div>

      <DashboardCard
        title={filter === 'sent' ? "سجل الإخطارات المرسلة" : "رسائل الدعم الواردة"}
        icon={filter === 'sent' ? "fas fa-paper-plane" : "fas fa-inbox"}
        action={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={() => setShowModal(true)} className="btn btn-primary w-full sm:w-auto justify-center">
              <i className="fas fa-plus"></i><span>إرسال إخطار جديد</span>
            </button>
            <Select
              options={[
                { value: 'sent', label: 'الإخطارات المرسلة' },
                { value: 'received', label: 'رسائل الدعم الواردة' }
              ]}
              value={filter}
              onChange={(value) => setFilter(value as 'sent' | 'received')}
              className="w-full sm:w-auto min-w-[200px]"
            />
          </div>
        }
      >
        <DataTable columns={filter === 'sent' ? sentTableColumns : receivedTableColumns} data={getFilteredData()} searchable={true} pagination={true} itemsPerPage={10} onRowClick={handleRowClick} />
      </DashboardCard>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="w-full max-w-[520px] bg-[#1a1a28] rounded-2xl shadow-2xl border border-white/10 animate-scaleIn max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-white">إرسال إخطار جديد</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" onClick={handleCloseModal}><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Type Toggle */}
                <div className="flex gap-1.5 p-1 bg-[#12121a] rounded-xl">
                  <button type="button" onClick={() => setNotificationType('text')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${notificationType === 'text' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-file-alt text-sm"></i><span>نص</span>
                  </button>
                  <button type="button" onClick={() => setNotificationType('voice')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${notificationType === 'voice' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-microphone text-sm"></i><span>صوتي</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300">العنوان</label>
                  <input type="text" id="title" className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="عنوان الإخطار" />
                </div>

                {notificationType === 'text' && (
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300">الرسالة</label>
                    <textarea id="message" className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px] resize-y" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required rows={3} placeholder="نص الرسالة..." />
                  </div>
                )}

                {notificationType === 'voice' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">الرسالة الصوتية</label>
                    {voiceBlob ? (
                      <div className="space-y-3">
                        <VoicePlayer voiceUrl={URL.createObjectURL(voiceBlob)} duration={voiceDuration} />
                        <button type="button" onClick={() => { setVoiceBlob(null); setVoiceDuration(0); }} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                          <i className="fas fa-redo"></i><span>إعادة التسجيل</span>
                        </button>
                      </div>
                    ) : (
                      <VoiceRecorder maxDuration={maxVoiceDuration} onRecordingComplete={handleRecordingComplete} disabled={!canSendVoice} />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="recipient_type" className="block text-sm font-medium text-gray-300">المستقبلين</label>
                  <Select
                    options={[
                      { value: 'all_users', label: 'جميع المستخدمين' },
                      { value: 'all_teachers', label: 'جميع المدرسين' },
                      { value: 'all_students', label: 'جميع الطلاب' },
                      { value: 'all_secretaries', label: 'جميع السكرتارية' }
                    ]}
                    value={formData.recipient_type}
                    onChange={(value) => setFormData({...formData, recipient_type: value})}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10 bg-black/30 shrink-0">
                <button type="button" className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all font-medium" onClick={handleCloseModal} disabled={isLoading}>إلغاء</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading || (notificationType === 'voice' && !voiceBlob)}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin"></i><span>جاري الإرسال...</span></> : <><i className={notificationType === 'voice' ? 'fas fa-microphone' : 'fas fa-paper-plane'}></i><span>إرسال</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NotificationDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} notification={selectedNotification} />
    </DashboardLayout>
  );
}
