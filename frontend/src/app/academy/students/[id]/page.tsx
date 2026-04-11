'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAcademyStudentDetails } from '@/services/academyService';
import { useRouter } from 'next/navigation';

import { LoadingSpinner, Button, Icon } from '@/components/ui';
export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [enrolledTeachers, setEnrolledTeachers] = useState<any[]>([]);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setIsLoading(true);
        setIsLoading(true);
        const data = await getAcademyStudentDetails(id, teacherFilter);
        console.log('Fetched Student Data:', data);
        setStudent(data);
        if (data.subscription_history) {
           setSubscriptionHistory(data.subscription_history);
        }
        if (data.enrolled_teachers) {
            setEnrolledTeachers(data.enrolled_teachers);
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
  }, [id, teacherFilter]);

  if (isLoading) {
    return (
      <DashboardLayout
        role="academy"
        user={{
          name: user?.name || 'الأكاديمية',
          avatar: user?.avatar || '',
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="sm" color="primary" />
            <p className="text-gray-light">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout
        role="academy"
        user={{
          name: user?.name || 'الأكاديمية',
          avatar: user?.avatar || '',
        }}
      >
        <div className="alert alert-danger">
          <Icon name="exclamation-circle" />
          <span>{error || 'الطالب غير موجود'}</span>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          <Icon name="arrow-right" className="ml-2" />
          <span>عودة</span>
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl sm:text-2xl overflow-hidden flex-shrink-0">
            {student.avatar ? (
              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <Icon name="user-graduate" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white m-0 truncate">{student.name}</h2>
            <p className="m-0 text-gray-light text-xs sm:text-sm truncate">{student.phone} | {student.group_name}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            <Icon name="arrow-right" className="ml-2 text-sm sm:text-base" />
            <span className="whitespace-nowrap">عودة</span>
          </Button>
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500">
              Debug: {enrolledTeachers.length} teachers
              {student?.debug_info && (
                <pre className="mt-2 p-2 bg-black/20 rounded text-[10px] overflow-auto max-w-[300px]">
                  {JSON.stringify(student.debug_info, null, 2)}
                </pre>
              )}
            </div>
            <Filter
                options={[
                  { value: '', label: 'كل المدرسين' },
                  ...enrolledTeachers.map(teacher => ({
                    value: teacher.id,
                    label: teacher.name
                  }))
                ]}
                value={teacherFilter}
                onChange={(value) => setTeacherFilter(value)}
                className="w-full sm:w-auto min-w-[200px]"
            />
          </div>
          {/*
          <Link href={`/academy/students/${student.enrollment_id}/edit`} className="btn btn-primary w-full sm:w-auto text-sm sm:text-base px-4 sm:px-5 py-3 sm:py-2.5">
            <Icon name="edit" className="text-sm sm:text-base" />
            <span className="whitespace-nowrap">تعديل الطالب</span>
          </Link>
          */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 mb-4 sm:mb-6">
        <StatCard
          title="متوسط الامتحانات"
          value={student.exam_stats?.month_average || 0}
          icon="star"
          color="warning"
          suffix="%"
          variant="centered"
        />
      </div>

      {/* Basic Data Section */}
      <DashboardCard
        title="البيانات الأساسية"
        icon="info-circle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="chalkboard-teacher" className="text-sm" />
              <span className="text-sm">المدرس</span>
            </div>
            <span className="text-white font-semibold ltr text-sm sm:text-base order-1 sm:order-2">{student.teacher_name || '-'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="phone" className="text-sm" />
              <span className="text-sm">رقم ولي الأمر</span>
            </div>
            <span className="text-white font-semibold ltr text-sm sm:text-base order-1 sm:order-2">{student.parent_phone || '-'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="venus-mars" className="text-sm" />
              <span className="text-sm">النوع</span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base order-1 sm:order-2">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="university" className="text-sm" />
              <span className="text-sm">نوع التعليم</span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base order-1 sm:order-2">{student.education_type === 'general' ? 'عام' : student.education_type === 'azhar' ? 'أزهري' : '-'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="layer-group" className="text-sm" />
              <span className="text-sm">الصف الدراسي</span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base order-1 sm:order-2">{student.grade_name || '-'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="users" className="text-sm" />
              <span className="text-sm">المجموعة</span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base order-1 sm:order-2">{student.group_name || '-'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="map-marker-alt" className="text-sm" />
              <span className="text-sm">الموقع</span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base order-1 sm:order-2">{student.location || '-'}</span>
          </div>

          <div className="bg-[#1a1f37] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors gap-2 sm:gap-0 sm:col-span-2">
            <div className="flex items-center gap-2 text-gray-light order-2 sm:order-1">
              <Icon name="calendar-alt" className="text-sm" />
              <span className="text-sm">تاريخ الإضافة</span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base order-1 sm:order-2">{new Date(student.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>
      </DashboardCard>


      {/* Subscription History Section */}
      <div className="mt-4 sm:mt-6">
        <DashboardCard
          title="سجل الاشتراكات"
          icon="history"
        >
          {subscriptionHistory.length === 0 ? (
            <div className="text-center p-6 sm:p-8">
              <p className="text-gray-light text-sm">لا يوجد سجل اشتراكات</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {subscriptionHistory.map((item: any, index: number) => (
                  <div key={index} className="bg-[#1a1f37] p-3 sm:p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold text-sm">{item.month_name}</span>
                      <span className={`badge text-xs ${
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
      <div className="mt-4 sm:mt-6">
        <DashboardCard
          title="سجل الامتحانات"
          icon="file-alt"
        >
          {(!student.exam_stats?.results || student.exam_stats.results.length === 0) ? (
            <div className="text-center p-6 sm:p-8">
              <p className="text-gray-light text-sm">لا توجد امتحانات سابقة</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {student.exam_stats.results.map((exam: any, index: number) => (
                  <div key={index} className="bg-[#1a1f37] p-3 sm:p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">{exam.exam_title}</div>
                        <div className="text-xs text-gray-light mt-1">{new Date(exam.date).toLocaleDateString('ar-EG')}</div>
                      </div>
                      <span className={`badge text-xs ${exam.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                        {exam.percentage >= 50 ? 'ناجح' : 'راسب'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center mt-2 py-2 bg-white/5 rounded-lg">
                      <Icon name="percent" className="text-primary text-xs ml-2" />
                      <span className="text-white text-base font-bold">{exam.percentage}%</span>
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
                            <Icon name="percent" className="text-primary text-xs" />
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
