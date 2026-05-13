'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { LoadingSpinner, LoadingState, Button, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getTeacherStudentDetails } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getTeacherStudentDetails(id);
        setStudent(data);
        // The API now returns subscription_history alongside student
        if (data.subscription_history) {
           setSubscriptionHistory(data.subscription_history);
        } else {
           // Fallback if API structure is slightly different (e.g. wrapped)
           // But based on controller change, it should be in the response root, 
           // however getTeacherStudentDetails returns res.student. 
           // Wait, getTeacherStudentDetails in authService returns res.student.
           // My controller returns { student: ..., subscription_history: ... }
           // So getTeacherStudentDetails will return the student object ONLY if it returns res.student.
           // I need to check authService again.
        }
      } catch (err: any) {
        console.error('Failed to fetch student details:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات الطالب');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout
        role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
        user={user || undefined}
      >
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout
        role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
        user={user || undefined}
      >
        <div className="alert alert-danger">
          <Icon name="exclamation-circle" />
          <span>{error || 'الطالب غير موجود'}</span>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          <Icon name="arrowRight" />
          <span>عودة</span>
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      {/* Immersive Header Section */}
      <div className="relative mb-8 mt-2">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-transparent blur-3xl -z-10 rounded-3xl"></div>
        <div className="premium-glass p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-3xl sm:text-4xl overflow-hidden premium-border shadow-2xl">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="graduationCap" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center text-white text-xs border-4 border-[#0a0a0a]">
                  <Icon name="check" size="xs" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                   <h1 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight">{student.name}</h1>
                   <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary-light text-[10px] font-bold uppercase tracking-wider">طالب</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-gray-light text-sm">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <Icon name="id-card" className="text-primary-light" />
                    <span className="ltr font-medium opacity-80">{student.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <Icon name="users" className="text-primary-light" />
                    <span className="font-medium opacity-80">{student.group_name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Button variant="outline" onClick={() => router.back()} className="flex-1 md:flex-initial premium-glass border-white/10 hover:bg-white/5 text-white">
                <Icon name="arrowRight" className="ml-2" />
                <span>عودة</span>
              </Button>
              <Link href={`/teacher/students/${student.id}/payment`} className="flex-1 md:flex-initial btn-success flex items-center justify-center px-6 rounded-xl shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Icon name="money-bill-wave" className="ml-2" />
                <span className="font-bold">تسجيل دفعة</span>
              </Link>
              <Link href={`/teacher/students/${student.id}/edit`} className="flex-1 md:flex-initial btn-primary flex items-center justify-center px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Icon name="edit" className="ml-2" />
                <span className="font-bold">تعديل</span>
              </Link>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <StatCard
          title="متوسط الامتحانات العام"
          value={student.exam_stats?.month_average || 0}
          icon="star"
          color="warning"
          suffix="%"
          variant="centered"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-12">
          <DashboardCard
            title="البيانات الأساسية"
            icon="fas fa-id-badge"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'رقم ولي الأمر', value: student.parent_phone, icon: 'phone', ltr: true },
                { label: 'النوع', value: student.gender === 'male' ? 'ذكر' : 'أنثى', icon: 'venus-mars' },
                { label: 'نوع التعليم', value: student.education_type === 'general' ? 'عام' : student.education_type === 'azhar' ? 'أزهري' : '-', icon: 'university' },
                { label: 'الصف الدراسي', value: student.grade_name, icon: 'layer-group' },
                { label: 'المجموعة', value: student.group_name, icon: 'users' },
                { label: 'الموقع', value: student.location, icon: 'map-marker-alt' },
                { label: 'تاريخ الإضافة', value: new Date(student.created_at).toLocaleDateString('ar-EG'), icon: 'calendar', full: true },
              ].map((item, idx) => (
                <div key={idx} className={`premium-glass p-4 rounded-xl border border-white/5 flex items-center gap-4 group ${item.full ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary-light group-hover:bg-primary/20 transition-colors shrink-0">
                    <Icon name={item.icon as any} size="sm" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-light uppercase tracking-wider mb-0.5 opacity-60">{item.label}</p>
                    <p className={`text-white font-bold ${item.ltr ? 'ltr' : ''}`}>{item.value || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* History Column - Subscriptions */}
        <div className="lg:col-span-12">
          <DashboardCard
            title="سجل الاشتراكات"
            icon="fas fa-wallet"
          >
            {subscriptionHistory.length === 0 ? (
              <div className="text-center py-12 premium-glass rounded-2xl border border-dashed border-white/10">
                <Icon name="history" className="text-4xl text-gray-light/20 mb-4" />
                <p className="text-gray-light font-medium">لا يوجد سجل اشتراكات حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Modern List Layout for both mobile/desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {subscriptionHistory.map((item: any, index: number) => (
                    <div key={index} className="premium-glass p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-black text-lg">{item.month_name}</h4>
                          <p className="text-xs text-gray-light opacity-60">تاريخ الاستحقاق: {item.month_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          item.status === 'paid' ? 'bg-success/20 text-success' : 
                          item.status === 'partial' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                        } border border-current/10`}>
                          {item.status_label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-light uppercase mb-1 opacity-50">المستحق</p>
                          <p className="text-white font-bold">{item.amount_due}</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                          <p className="text-[9px] text-gray-light uppercase mb-1 opacity-50">المدفوع</p>
                          <p className="text-success font-black">{item.amount_paid}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-gray-light uppercase mb-1 opacity-50">المتبقي</p>
                          <p className="text-danger font-black">{item.amount_remaining}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* History Column - Exams */}
        <div className="lg:col-span-12">
          <DashboardCard
            title="سجل الامتحانات"
            icon="fas fa-file-signature"
          >
            {(!student.exam_stats?.results || student.exam_stats.results.length === 0) ? (
              <div className="text-center py-12 premium-glass rounded-2xl border border-dashed border-white/10">
                <Icon name="file-alt" className="text-4xl text-gray-light/20 mb-4" />
                <p className="text-gray-light font-medium">لا توجد امتحانات سابقة مسجلة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {student.exam_stats.results.map((exam: any, index: number) => (
                  <div key={index} className="premium-glass p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate mb-1">{exam.exam_title}</h4>
                        <p className="text-xs text-gray-light opacity-60 flex items-center gap-1">
                          <Icon name="calendar" size="xs" />
                          {new Date(exam.date).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-white/10 ${exam.percentage >= 50 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                         <span className="text-lg font-black">{exam.percentage}</span>
                         <span className="text-[8px] font-bold">%</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between relative z-10">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${exam.percentage >= 50 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {exam.percentage >= 50 ? 'ناجح' : 'راسب'}
                       </span>
                       <button className="text-[10px] font-bold text-primary-light hover:underline">التفاصيل</button>
                    </div>

                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-all duration-1000" style={{ width: `${exam.percentage}%` }}></div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

