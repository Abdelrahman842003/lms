'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button, LoadingSpinner, Icon, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import ScanAttendanceModal from '@/components/dashboard/ScanAttendanceModal';
import * as teacherService from '@/services/teacherService';
import { cn } from '@/utils';

export default function TeacherAttendancePage() {
  const { user, isAuthenticated, isLoading: authLoading, selectedAcademy } = useAuth();
  const router = useRouter();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'teacher')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchTodayStatus = async () => {
    try {
      setIsLoading(true);
      const response = await teacherService.getTodayAttendanceStatus();
      if (response.status && response.data) {
        setTodayLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userType === 'teacher' && selectedAcademy?.id && selectedAcademy.id !== 'independent') {
      fetchTodayStatus();
    }
  }, [user, selectedAcademy]);

  const handleScanSuccess = () => fetchTodayStatus();

  if (authLoading || !user || user.userType !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedAcademy?.id || selectedAcademy.id === 'independent') {
    return (
      <DashboardLayout role="teacher" user={user}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-light/20 text-4xl mb-8">
            <Icon name="university" />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">هذه الميزة متاحة فقط للأكاديميات</h2>
          <p className="text-gray-light/40 text-sm max-w-md font-medium leading-relaxed">
            يرجى اختيار أكاديمية من القائمة المنسدلة في الأعلى للوصول إلى نظام تسجيل الحضور والانصراف الذكي.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const latestLog = todayLogs.length > 0 ? todayLogs[0] : null;
  const isCheckedIn = latestLog?.status === 'checked_in';
  const totalHours = todayLogs.reduce((sum, log) => {
    if (log.duration_formatted) {
      const h = parseInt(log.duration_formatted.split('h')[0] || '0');
      return sum + h;
    }
    return sum;
  }, 0);

  return (
    <DashboardLayout role="teacher" user={user}>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Immersive Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success text-2xl shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <Icon name="fingerprint" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">الحضور والانصراف</h1>
              <p className="text-[10px] font-bold text-gray-light/20 uppercase tracking-widest">تتبع ساعات العمل والجلسات اليومية</p>
            </div>
          </div>

          <Button 
            onClick={() => setIsScanModalOpen(true)}
            className="w-full md:w-auto h-12 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            <Icon name="qrcode" className="ml-2" />
            مسح رمز QR
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-[2rem] premium-glass premium-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 mb-4">
               <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg", isCheckedIn ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                 <Icon name={isCheckedIn ? "check-circle" : "times-circle"} />
               </div>
               <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">الحالة الحالية</span>
            </div>
            <div className="text-3xl font-black text-white uppercase tracking-tighter">{isCheckedIn ? 'حاضر الآن' : 'منصرف حالياً'}</div>
          </div>

          <div className="p-6 rounded-[2rem] premium-glass premium-border relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg">
                 <Icon name="calendar-check" />
               </div>
               <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">سجلات اليوم</span>
            </div>
            <div className="text-3xl font-black text-white uppercase tracking-tighter">{todayLogs.length} <span className="text-sm opacity-20">سجلات</span></div>
          </div>

          <div className="p-6 rounded-[2rem] premium-glass premium-border relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-lg">
                 <Icon name="clock" />
               </div>
               <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">إجمالي الساعات</span>
            </div>
            <div className="text-3xl font-black text-white uppercase tracking-tighter">{totalHours} <span className="text-sm opacity-20">ساعات</span></div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-light/30 uppercase tracking-widest">سجل نشاط اليوم</h3>
              {isLoading && <LoadingSpinner size="sm" />}
           </div>

           {todayLogs.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {todayLogs.map((log, index) => (
                 <div key={log.id || index} className="p-5 rounded-2xl premium-glass premium-border flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="space-y-3">
                       <div className="flex items-center gap-3">
                          <Badge variant={log.status === 'checked_in' ? 'success' : 'danger'} size="sm" className="font-black uppercase tracking-widest scale-90">
                            {log.status === 'checked_in' ? 'حضور' : 'انصراف'}
                          </Badge>
                          <span className="text-xs font-black text-white">{log.academy?.name || selectedAcademy?.name}</span>
                       </div>
                       <div className="flex items-center gap-4 text-[10px] font-bold text-gray-light/30 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                             <Icon name="clock" className="text-primary/50" />
                             <span>{log.checked_in_at ? new Date(log.checked_in_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                          </div>
                          {log.checked_out_at && (
                            <>
                              <div className="w-1 h-1 rounded-full bg-white/5" />
                              <div className="flex items-center gap-1.5">
                                 <Icon name="sign-out-alt" className="text-danger/50" />
                                 <span>{new Date(log.checked_out_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </>
                          )}
                       </div>
                    </div>

                    {log.duration_formatted && (
                      <div className="text-left bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <div className="text-lg font-black text-white tracking-tighter">{log.duration_formatted}</div>
                        <div className="text-[9px] font-black text-gray-light/20 uppercase tracking-widest text-center">المدة</div>
                      </div>
                    )}
                 </div>
               ))}
             </div>
           ) : (
             <div className="py-20 text-center premium-glass premium-border rounded-[3rem] opacity-30">
                <Icon name="calendar-times" className="text-4xl mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">لا توجد سجلات حضور لليوم</p>
             </div>
           )}
        </div>
      </div>

      <ScanAttendanceModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </DashboardLayout>
  );
}
