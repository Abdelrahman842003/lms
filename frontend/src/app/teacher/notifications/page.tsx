'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Filter } from '@/components/Filter';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGrades, Grade } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
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

function NotificationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [receivedNotifications, setReceivedNotifications] = useState<ReceivedNotification[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice notification state
  const [notificationType, setNotificationType] = useState<'text' | 'voice'>('text');
  const [canSendVoice, setCanSendVoice] = useState(true);
  const [maxVoiceDuration, setMaxVoiceDuration] = useState(40);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'all',
    grade_id: '',
    group_id: '',
  });

  const [filter, setFilter] = useState<'students' | 'sent_to_developer' | 'from_developer'>('students');

  const getFilteredData = () => {
    if (filter === 'from_developer') {
      return (receivedNotifications || []).map(n => ({
        ...n,
        title: n.data?.title || 'بدون عنوان',
        message: n.data?.message || '',
        is_voice: n.data?.is_voice || false,
        voice_url: n.data?.voice_url || n.voice_url,
        voice_duration: n.data?.voice_duration,
      }));
    }
    return (notifications || []).filter(n => {
      if (filter === 'sent_to_developer') return n.recipient_type === 'admin';
      return ['all', 'grade', 'group'].includes(n.recipient_type);
    });
  };

  const filteredData = getFilteredData();

  useEffect(() => {
    fetchGrades();
    fetchGroups();
    fetchNotifications();
    fetchVoiceLimit();

    const recipient = searchParams.get('recipient');
    if (recipient) {
      if (recipient === 'admin') {
        setFilter('sent_to_developer');
      } else if (recipient === 'students') {
        setFilter('students');
      } else if (recipient === 'from_developer') {
        setFilter('from_developer');
      }
    }
  }, [searchParams]);

  const fetchVoiceLimit = async () => {
    try {
      const response = await checkVoiceLimit();
      setCanSendVoice(response.can_send_voice);
      setMaxVoiceDuration(response.max_duration);
    } catch (error: any) {
      // If endpoint doesn't exist yet (404), default to allowing voice
      // This handles the case before migrations are run
      if (error?.status === 404) {
        console.log('Voice limit endpoint not found, defaulting to enabled');
        setCanSendVoice(true);
        setMaxVoiceDuration(90);
      } else {
        console.error('Failed to check voice limit:', error);
      }
    }
  };

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

  const fetchGrades = async () => {
    try {
      const response = await getGrades();
      setGrades(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      setGrades([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    }
  };

  const sentTableColumns = [
    { key: 'title', label: 'العنوان', sortable: true },
    {
      key: 'message',
      label: 'الرسالة',
      sortable: false,
      render: (value: string, row: any) => {
        if (row.is_voice) {
          return (
            <span className="inline-flex items-center gap-2 text-primary">
              <i className="fas fa-microphone"></i>
              <span>رسالة صوتية</span>
              {row.voice_duration && <span className="text-gray-400">({Math.floor(row.voice_duration / 60)}:{(row.voice_duration % 60).toString().padStart(2, '0')})</span>}
            </span>
          );
        }
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      },
    },
    {
      key: 'recipient_type',
      label: 'نوع المستقبلين',
      sortable: true,
      render: (value: string) => {
        const types: {[key: string]: string} = { 'all': 'جميع الطلاب', 'grade': 'صف دراسي', 'group': 'مجموعة', 'admin': 'الإدارة/المطور' };
        return types[value] || value;
      }
    },
    { key: 'recipient_count', label: 'عدد المستقبلين', sortable: true },
    { key: 'created_at', label: 'تاريخ الإرسال', sortable: true, render: (value: string) => new Date(value).toLocaleDateString('ar-EG') },
  ];

  const receivedTableColumns = [
    { key: 'title', label: 'العنوان', sortable: true, render: (value: string) => value },
    {
      key: 'message',
      label: 'الرسالة',
      sortable: false,
      render: (value: string, row: any) => {
        if (row.is_voice) {
          return (<span className="inline-flex items-center gap-2 text-primary"><i className="fas fa-microphone"></i><span>رسالة صوتية</span></span>);
        }
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      },
    },
    { key: 'created_at', label: 'تاريخ الاستلام', sortable: true, render: (value: string) => new Date(value).toLocaleDateString('ar-EG') },
  ];

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
          grade_id: formData.grade_id ? parseInt(formData.grade_id) : undefined,
          group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
        });
        toast.success('تم إرسال الرسالة الصوتية بنجاح');
        setCanSendVoice(false);
      } else {
        await sendNotification({
          title: formData.title,
          message: formData.message,
          recipient_type: formData.recipient_type as any,
          grade_id: formData.grade_id ? parseInt(formData.grade_id) : undefined,
          group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
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
    setFormData({ title: '', message: '', recipient_type: 'all', grade_id: '', group_id: '' });
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

  const getStats = () => {
    if (filter === 'from_developer') {
      return {
        card1: { title: 'إجمالي الإخطارات المستلمة', value: receivedNotifications.length, icon: 'fas fa-inbox', color: 'primary' },
        card2: { title: 'الإخطارات غير المقروءة', value: receivedNotifications.filter(n => !n.read_at).length, icon: 'fas fa-envelope', color: 'warning' }
      };
    }
    const data = filteredData as SentNotification[];
    return {
      card1: { title: 'إجمالي الإخطارات المرسلة', value: data.length, icon: 'fas fa-paper-plane', color: 'primary' },
      card2: { title: 'إجمالي المستقبلين', value: data.reduce((acc, curr) => acc + (curr.recipient_count || 0), 0), icon: 'fas fa-users', color: 'secondary' }
    };
  };

  const stats = getStats();

  return (
    <DashboardLayout role={user?.userType as 'teacher' | 'secretary' || 'teacher'} user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard title={stats.card1.title} value={stats.card1.value} icon={stats.card1.icon} color={stats.card1.color} />
        <StatCard title={stats.card2.title} value={stats.card2.value} icon={stats.card2.icon} color={stats.card2.color} />
      </div>

      <DashboardCard
        title="سجل الإخطارات"
        icon="fas fa-list"
        action={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={() => { setFormData(prev => ({ ...prev, recipient_type: 'admin' })); setShowModal(true); }} className="btn btn-secondary w-full sm:w-auto justify-center">
              <i className="fas fa-headset"></i><span>تواصل مع الدعم</span>
            </button>
            {filter !== 'from_developer' && (
              <button onClick={() => { setFormData(prev => ({ ...prev, recipient_type: filter === 'sent_to_developer' ? 'admin' : 'all' })); setShowModal(true); }} className="btn btn-primary w-full sm:w-auto justify-center">
                <i className="fas fa-paper-plane"></i><span>{filter === 'sent_to_developer' ? 'إرسال للمطور' : 'إرسال للطلاب'}</span>
              </button>
            )}
            <Filter options={[{ value: 'students', label: 'للطلاب' }, { value: 'sent_to_developer', label: 'مرسلة للمطور' }, { value: 'from_developer', label: 'من المطور' }]} value={filter} onChange={(value) => setFilter(value as any)} className="w-full sm:w-auto min-w-[150px]" />
          </div>
        }
      >
        <DataTable columns={filter === 'from_developer' ? receivedTableColumns : sentTableColumns} data={filteredData} searchable={true} pagination={true} itemsPerPage={10} onRowClick={handleRowClick} />
      </DashboardCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="w-full max-w-[520px] bg-[#1a1a28] rounded-2xl shadow-2xl border border-white/10 animate-scaleIn max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-white">{formData.recipient_type === 'admin' ? 'إرسال رسالة للمطور' : 'إرسال إخطار للطلاب'}</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" onClick={handleCloseModal}><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Type Toggle */}
                <div className="flex gap-1.5 p-1 bg-[#12121a] rounded-xl">
                  <button type="button" onClick={() => setNotificationType('text')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${notificationType === 'text' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-file-alt text-sm"></i><span>نص</span>
                  </button>
                  <button type="button" onClick={() => setNotificationType('voice')} disabled={!canSendVoice} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${notificationType === 'voice' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : canSendVoice ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 cursor-not-allowed'}`}>
                    <i className="fas fa-microphone text-sm"></i><span>صوتي</span>
                    {!canSendVoice && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">مستخدم</span>}
                  </button>
                </div>

                {!canSendVoice && notificationType === 'text' && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                    <i className="fas fa-info-circle mr-2"></i>لقد استخدمت حصتك اليومية من الرسائل الصوتية. يمكنك إرسال رسالة صوتية جديدة غداً.
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300">العنوان</label>
                  <input type="text" id="title" className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder={formData.recipient_type === 'admin' ? "مثال: طلب تعديل، إبلاغ عن مشكلة..." : "مثال: تنبيه هام"} />
                </div>

                {notificationType === 'text' && (
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300">الرسالة</label>
                    <textarea id="message" className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[120px] resize-y" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required rows={4} placeholder="اكتب رسالتك هنا..." />
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

                {formData.recipient_type !== 'admin' && (
                  <div className="space-y-2">
                    <label htmlFor="recipient_type" className="block text-sm font-medium text-gray-300">المستقبلين</label>
                    <Filter options={[{ value: 'all', label: 'جميع الطلاب' }, { value: 'grade', label: 'صف دراسي معين' }, { value: 'group', label: 'مجموعة معينة' }]} value={formData.recipient_type} onChange={(value) => setFormData({...formData, recipient_type: value, grade_id: '', group_id: ''})} className="w-full" />
                  </div>
                )}

                {formData.recipient_type === 'grade' && (
                  <div className="space-y-2">
                    <label htmlFor="grade_id" className="block text-sm font-medium text-gray-300">اختر الصف</label>
                    <Filter options={[{ value: '', label: '-- اختر الصف --' }, ...grades.map(grade => ({ value: grade.id.toString(), label: grade.name }))]} value={formData.grade_id} onChange={(value) => setFormData({...formData, grade_id: value})} className="w-full" />
                  </div>
                )}

                {formData.recipient_type === 'group' && (
                  <div className="space-y-2">
                    <label htmlFor="group_id" className="block text-sm font-medium text-gray-300">اختر المجموعة</label>
                    <Filter options={[{ value: '', label: '-- اختر المجموعة --' }, ...groups.map(group => ({ value: group.id.toString(), label: group.name }))]} value={formData.group_id} onChange={(value) => setFormData({...formData, group_id: value})} className="w-full" />
                  </div>
                )}
              </div>
              
              {/* Footer */}
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

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"></div>}>
      <NotificationsContent />
    </Suspense>
  );
}
