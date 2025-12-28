'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
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
        null
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
          <i className="fas fa-exclamation-circle"></i>
          <span>{error || 'الطالب غير موجود'}</span>
        </div>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          <i className="fas fa-arrow-right"></i>
          <span>عودة</span>
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl overflow-hidden">
            {student.avatar ? (
              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-user-graduate"></i>
            )}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white m-0">{student.name}</h2>
            <p className="m-0 text-gray-light text-xs sm:text-sm">{student.phone} | {student.group_name}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button onClick={() => router.back()} className="btn btn-outline flex-1 sm:flex-none text-sm sm:text-base">
            <i className="fas fa-arrow-right"></i>
            <span>عودة</span>
          </button>
          <Link href={`/teacher/students/${student.id}/edit`} className="btn btn-primary flex-1 sm:flex-none text-sm sm:text-base">
            <i className="fas fa-edit"></i>
            <span>تعديل الطالب</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="حضور الشهر"
          value={`${student.attendance_stats?.present_count || 0} / ${student.attendance_stats?.total_lectures || 0}`}
          icon="fas fa-calendar-check"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="متوسط الحضور"
          value={student.attendance_stats?.average || 0}
          icon="fas fa-chart-pie"
          color="success"
          suffix="%"
          variant="centered"
        />

        <StatCard
          title="متوسط الامتحانات"
          value={student.exam_stats?.month_average || 0}
          icon="fas fa-star"
          color="warning"
          suffix="%"
          variant="centered"
        />
      </div>

      {/* Basic Data Section */}
      {/* Basic Data Section */}
      {/* Basic Data Section */}
      <DashboardCard
        title="البيانات الأساسية"
        icon="fas fa-info-circle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">


          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold ltr">{student.parent_phone || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>رقم ولي الأمر</span>
              <i className="fas fa-phone"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>النوع</span>
              <i className="fas fa-venus-mars"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{student.education_type === 'general' ? 'عام' : student.education_type === 'azhar' ? 'أزهري' : '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>نوع التعليم</span>
              <i className="fas fa-university"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{student.grade_name || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>الصف الدراسي</span>
              <i className="fas fa-layer-group"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{student.group_name || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>المجموعة</span>
              <i className="fas fa-users"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{student.location || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>الموقع</span>
              <i className="fas fa-map-marker-alt"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{new Date(student.created_at).toLocaleDateString('ar-EG')}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>تاريخ الإضافة</span>
              <i className="fas fa-calendar-alt"></i>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Subscription History Section */}
      <div className="mt-6 sm:mt-8">
        <DashboardCard
          title="سجل الاشتراكات"
          icon="fas fa-history"
        >
          {subscriptionHistory.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-light">لا يوجد سجل اشتراكات</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {subscriptionHistory.map((item: any, index: number) => (
                  <div key={index} className="bg-[#1a1f37] p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-bold">{item.month_name}</span>
                      <span className={`badge ${
                        item.status === 'paid' ? 'badge-success' : 
                        item.status === 'partial' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {item.status_label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-light mb-1">المستحق</div>
                        <div className="text-white font-medium">{item.amount_due}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-light mb-1">المدفوع</div>
                        <div className="text-success font-medium">{item.amount_paid}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-light mb-1">المتبقي</div>
                        <div className="text-danger font-medium">{item.amount_remaining}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-light text-sm">
                      <th className="pb-4 font-medium">الشهر</th>
                      <th className="pb-4 font-medium">المبلغ المستحق</th>
                      <th className="pb-4 font-medium">المدفوع</th>
                      <th className="pb-4 font-medium">المتبقي</th>
                      <th className="pb-4 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {subscriptionHistory.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 text-white">{item.month_name}</td>
                        <td className="py-4 text-white">{item.amount_due} EGP</td>
                        <td className="py-4 text-success">{item.amount_paid} EGP</td>
                        <td className="py-4 text-danger">{item.amount_remaining} EGP</td>
                        <td className="py-4">
                          <span className={`badge ${
                            item.status === 'paid' ? 'badge-success' : 
                            item.status === 'partial' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {item.status_label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DashboardCard>
      </div>

      {/* Exams History Section */}
      <div className="mt-6 sm:mt-8">
        <DashboardCard
          title="سجل الامتحانات"
          icon="fas fa-file-alt"
        >
          {(!student.exam_stats?.results || student.exam_stats.results.length === 0) ? (
            <div className="text-center p-8">
              <p className="text-gray-light">لا توجد امتحانات سابقة</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {student.exam_stats.results.map((exam: any, index: number) => (
                  <div key={index} className="bg-[#1a1f37] p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">{exam.exam_title}</div>
                        <div className="text-xs text-gray-light mt-1">{new Date(exam.date).toLocaleDateString('ar-EG')}</div>
                      </div>
                      <span className={`badge ${exam.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                        {exam.percentage >= 50 ? 'ناجح' : 'راسب'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center mt-3 py-2 bg-white/5 rounded-lg">
                      <i className="fas fa-percent text-primary text-xs ml-2"></i>
                      <span className="text-white text-lg font-bold">{exam.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-light text-sm">
                      <th className="pb-4 font-medium">الامتحان</th>
                      <th className="pb-4 font-medium">النسبة</th>
                      <th className="pb-4 font-medium">التاريخ</th>
                      <th className="pb-4 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {student.exam_stats.results.map((exam: any, index: number) => (
                      <tr key={index} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 text-white">
                          <div>
                            <div className="font-medium">{exam.exam_title}</div>
                            <div className="text-xs text-gray-light mt-1">{exam.description || 'تفاصيل الامتحانات'}</div>
                          </div>
                        </td>
                        <td className="py-4 text-white">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-percent text-primary text-xs"></i>
                            <span>{exam.percentage}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-300">
                          {new Date(exam.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-4">
                          <span className={`badge ${exam.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                            {exam.percentage >= 50 ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

