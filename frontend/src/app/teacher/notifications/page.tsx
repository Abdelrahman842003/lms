'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Filter } from '@/components/Filter';
import { FormModal, Button, Icon, Input, Textarea, Badge, LoadingSpinner } from '@/components/ui';
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
import { cn } from '@/utils';

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
      if (recipient === 'admin') setFilter('sent_to_developer');
      else if (recipient === 'students') setFilter('students');
      else if (recipient === 'from_developer') setFilter('from_developer');
    }

    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      
      const newReceivedNotif: ReceivedNotification = {
        id: data.notification_id || Date.now().toString(),
        type: data.type || 'general',
        data: {
          title: data.title,
          message: data.message,
          is_voice: data.data?.is_voice || data.is_voice,
          voice_url: data.data?.voice_url || data.voice_url,
          voice_duration: data.data?.voice_duration || data.voice_duration,
          sender_name: data.data?.sender_name,
        },
        read_at: null,
        created_at: data.created_at || new Date().toISOString()
      };

      setReceivedNotifications(prev => {
        if (prev.some(n => n.id === newReceivedNotif.id)) return prev;
        return [newReceivedNotif, ...prev];
      });
    };

    window.addEventListener('notification:reverb:received', handleRealtimeNotification);
    return () => window.removeEventListener('notification:reverb:received', handleRealtimeNotification);
  }, [searchParams]);

  const fetchVoiceLimit = async () => {
    try {
      const response = await checkVoiceLimit();
      setCanSendVoice(response.can_send_voice);
      setMaxVoiceDuration(response.max_duration);
    } catch (error: any) {
      if (error?.status === 404) {
        setCanSendVoice(true);
        setMaxVoiceDuration(90);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.notifications || []);
      setReceivedNotifications(response.received_notifications || []);
    } catch {
      setNotifications([]);
      setReceivedNotifications([]);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await getGrades();
      setGrades(response?.data || []);
    } catch {
      setGrades([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      setGroups((response as any)?.groups || (response as any)?.data || []);
    } catch {
      setGroups([]);
    }
  };

  const sentTableColumns = [
    { 
      key: 'title', 
      label: 'العنوان', 
      render: (val: string) => <span className="font-black text-white">{val}</span>
    },
    {
      key: 'message',
      label: 'المحتوى',
      render: (value: string, row: any) => {
        if (row.is_voice) {
          return (
            <span className="inline-flex items-center gap-2 text-primary font-bold">
              <Icon name="microphone" />
              <span>رسالة صوتية</span>
            </span>
          );
        }
        return <span className="text-gray-light/40">{value.length > 40 ? value.substring(0, 40) + '...' : value}</span>;
      },
    },
    {
      key: 'recipient_type',
      label: 'الجمهور',
      render: (value: string) => {
        const map: any = { all: 'الكل', grade: 'صف', group: 'مجموعة', admin: 'الدعم' };
        return <Badge variant="info" size="xs" className="font-black">{map[value] || value}</Badge>;
      }
    },
    { key: 'recipient_count', label: 'العدد', render: (v: any) => <span className="font-mono text-gray-light/60">{v || 0}</span> },
    { key: 'created_at', label: 'التاريخ', render: (v: string) => <span className="text-[10px] font-bold text-gray-light/30">{new Date(v).toLocaleDateString('ar-EG')}</span> },
  ];

  const receivedTableColumns = [
    { key: 'title', label: 'العنوان', render: (v: string) => <span className="font-black text-white">{v}</span> },
    {
      key: 'message',
      label: 'الرسالة',
      render: (value: string, row: any) => {
        if (row.is_voice) return <span className="text-primary font-bold"><Icon name="microphone" className="ml-1" /> صوتية</span>;
        return <span className="text-gray-light/40">{value.length > 40 ? value.substring(0, 40) + '...' : value}</span>;
      },
    },
    { key: 'created_at', label: 'الاستلام', render: (v: string) => <span className="text-[10px] font-bold text-gray-light/30">{new Date(v).toLocaleDateString('ar-EG')}</span> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('العنوان مطلوب'); return; }
    if (formData.recipient_type === 'grade' && !formData.grade_id) { toast.error('اختر الصف'); return; }
    if (formData.recipient_type === 'group' && !formData.group_id) { toast.error('اختر المجموعة'); return; }

    setIsLoading(true);
    try {
      if (notificationType === 'voice') {
        if (!voiceBlob) { toast.error('سجّل رسالة صوتية'); setIsLoading(false); return; }
        await sendVoiceNotification({
          title: formData.title,
          voice: voiceBlob,
          duration: voiceDuration,
          recipient_type: formData.recipient_type as any,
          grade_id: formData.grade_id ? parseInt(formData.grade_id) : undefined,
          group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
        });
      } else {
        if (!formData.message.trim()) { toast.error('الرسالة مطلوبة'); setIsLoading(false); return; }
        await sendNotification({
          title: formData.title,
          message: formData.message,
          recipient_type: formData.recipient_type as any,
          grade_id: formData.grade_id ? parseInt(formData.grade_id) : undefined,
          group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
        });
      }
      toast.success('تم الإرسال بنجاح');
      handleCloseModal();
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.message || 'فشل الإرسال');
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

  const getStats = () => {
    if (filter === 'from_developer') {
      return {
        card1: { title: 'إجمالي المستلمة', value: receivedNotifications.length, icon: 'inbox', color: 'primary' },
        card2: { title: 'غير مقروءة', value: receivedNotifications.filter(n => !n.read_at).length, icon: 'envelope', color: 'warning' }
      };
    }
    const data = (filter === 'sent_to_developer' ? notifications.filter(n => n.recipient_type === 'admin') : notifications.filter(n => ['all','grade','group'].includes(n.recipient_type)));
    return {
      card1: { title: 'إجمالي المرسلة', value: data.length, icon: 'paper-plane', color: 'primary' },
      card2: { title: 'إجمالي الجمهور', value: data.reduce((acc, curr) => acc + (curr.recipient_count || 0), 0), icon: 'users', color: 'secondary' }
    };
  };

  const stats = getStats();

  return (
    <DashboardLayout role={user?.userType as any} user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Immersive Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title={stats.card1.title} value={stats.card1.value} icon={stats.card1.icon} color={stats.card1.color} />
          <StatCard title={stats.card2.title} value={stats.card2.value} icon={stats.card2.icon} color={stats.card2.color} />
          
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => { setFormData(prev => ({ ...prev, recipient_type: 'admin' })); setShowModal(true); }}
              className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-secondary text-white font-black uppercase tracking-widest transition-all"
            >
              <Icon name="headset" />
              <span>تواصل مع المطور</span>
            </Button>
            {filter !== 'from_developer' && (
              <Button 
                variant="primary" 
                onClick={() => { setFormData(prev => ({ ...prev, recipient_type: filter === 'sent_to_developer' ? 'admin' : 'all' })); setShowModal(true); }}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest transition-all"
              >
                <Icon name="paper-plane" />
                <span>{filter === 'sent_to_developer' ? 'إرسال للمطور' : 'إخطار جديد'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                <Icon name="history" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">مركز الإخطارات</h2>
                <p className="text-xs font-bold text-gray-light/20 uppercase tracking-widest">عرض وإدارة جميع الرسائل المرسلة والمستلمة</p>
              </div>
            </div>
            
            <div className="flex p-1.5 rounded-2xl premium-glass premium-border min-w-[300px]">
              {(['students', 'sent_to_developer', 'from_developer'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-primary text-white shadow-lg" : "text-gray-light/40 hover:text-white"
                  )}
                >
                  {f === 'students' ? 'للطلاب' : f === 'sent_to_developer' ? 'للمطور' : 'من المطور'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] premium-glass premium-border p-4 md:p-8">
            <DataTable 
              columns={filter === 'from_developer' ? receivedTableColumns : sentTableColumns} 
              data={filteredData} 
              searchable={true} 
              pagination={true} 
              itemsPerPage={10} 
              onRowClick={(row) => { setSelectedNotification(row); setShowDetailsModal(true); }} 
            />
          </div>
        </div>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        title={formData.recipient_type === 'admin' ? 'إرسال رسالة للمطور' : 'إرسال إخطار للطلاب'}
        isLoading={isLoading}
        submitText={isLoading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
        maxWidth="550px"
      >
        <div className="space-y-8 py-2">
          {/* Choice Box */}
          <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-black/40 border border-white/5">
            <button 
              type="button"
              onClick={() => setNotificationType('text')}
              className={cn(
                "h-12 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
                notificationType === 'text' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-gray-light/40 hover:text-white"
              )}
            >
              <Icon name="file-alt" /> نصية
            </button>
            <button 
              type="button"
              onClick={() => setNotificationType('voice')}
              disabled={!canSendVoice}
              className={cn(
                "h-12 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
                notificationType === 'voice' ? "bg-secondary text-white shadow-xl shadow-secondary/20" : canSendVoice ? "text-gray-light/40 hover:text-white" : "opacity-30 cursor-not-allowed"
              )}
            >
              <Icon name="microphone" /> صوتية
              {!canSendVoice && <Badge variant="danger" size="xs">استهلكت</Badge>}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-widest px-2">عنوان الإخطار</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="أدخل عنواناً واضحاً للرسالة..." 
                className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold"
              />
            </div>

            {notificationType === 'text' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-widest px-2">نص الرسالة</label>
                <Textarea 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                  className="min-h-[150px] bg-white/5 border-white/10 rounded-2xl p-5 text-sm leading-relaxed" 
                  placeholder="اكتب تفاصيل الإخطار هنا..."
                />
              </div>
            ) : (
              <div className="space-y-4 p-8 rounded-[2rem] bg-secondary/5 border border-secondary/10 text-center">
                {voiceBlob ? (
                  <div className="space-y-4">
                    <VoicePlayer voiceUrl={URL.createObjectURL(voiceBlob)} duration={voiceDuration} />
                    <button onClick={() => { setVoiceBlob(null); setVoiceDuration(0); }} className="text-[10px] font-black text-danger uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
                      <Icon name="redo" /> مسح وإعادة التسجيل
                    </button>
                  </div>
                ) : (
                  <VoiceRecorder maxDuration={maxVoiceDuration} onRecordingComplete={(b, d) => { setVoiceBlob(b); setVoiceDuration(d); }} disabled={!canSendVoice} />
                )}
              </div>
            )}

            {formData.recipient_type !== 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-widest px-2">الجمهور المستهدف</label>
                  <Filter 
                    options={[{ value: 'all', label: 'الجميع' }, { value: 'grade', label: 'صف محدد' }, { value: 'group', label: 'مجموعة محددة' }]} 
                    value={formData.recipient_type} 
                    onChange={(v) => setFormData({...formData, recipient_type: v, grade_id: '', group_id: ''})} 
                    className="w-full" 
                  />
                </div>
                {formData.recipient_type === 'grade' && (
                  <div className="space-y-2 animate-in slide-in-from-right-4">
                    <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-widest px-2">اختر الصف</label>
                    <Filter options={[{ value: '', label: 'اختر الصف' }, ...grades.map(g => ({ value: g.id.toString(), label: g.name }))]} value={formData.grade_id} onChange={(v) => setFormData({...formData, grade_id: v})} className="w-full" />
                  </div>
                )}
                {formData.recipient_type === 'group' && (
                  <div className="space-y-2 animate-in slide-in-from-right-4">
                    <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-widest px-2">اختر المجموعة</label>
                    <Filter options={[{ value: '', label: 'اختر المجموعة' }, ...groups.map(g => ({ value: g.id.toString(), label: g.name }))]} value={formData.group_id} onChange={(v) => setFormData({...formData, group_id: v})} className="w-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FormModal>

      <NotificationDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} notification={selectedNotification} />
    </DashboardLayout>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>}>
      <NotificationsContent />
    </Suspense>
  );
}
