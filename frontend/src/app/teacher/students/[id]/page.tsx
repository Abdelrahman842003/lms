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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getTeacherStudentDetails(id);
        setStudent(data);
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
      {/* Stats Grid */}
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
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

        <StatCard
          title="المدفوعات"
          value={student.payment_stats?.total_paid || 0}
          icon="fas fa-dollar-sign"
          color="danger"
          prefix="EGP"
          variant="centered"
        />
      </div>

      {/* Header Section */}
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl overflow-hidden">
            {student.avatar ? (
              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-user-graduate"></i>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white m-0">{student.name}</h2>
            <p className="m-0 text-gray-light text-sm">{student.phone} | {student.group_name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn btn-outline">
            <i className="fas fa-arrow-right"></i>
            <span>عودة</span>
          </button>
          <Link href={`/teacher/students/${student.id}/edit`} className="btn btn-primary">
            <i className="fas fa-edit"></i>
            <span>تعديل الطالب</span>
          </Link>
        </div>
      </div>

      {/* Basic Data Section */}
      {/* Basic Data Section */}
      {/* Basic Data Section */}
      <DashboardCard
        title="البيانات الأساسية"
        icon="fas fa-info-circle"
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{student.username}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>اسم المستخدم</span>
              <i className="fas fa-user"></i>
            </div>
          </div>

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

      {/* Exams Grid */}
      <div className="mt-8">
        {(!student.exam_stats?.results || student.exam_stats.results.length === 0) ? (
          <div className="text-center p-12 bg-white/[0.02] rounded-2xl">
            <i className="fas fa-clipboard-list text-5xl text-gray-light mb-4 opacity-50"></i>
            <p className="text-gray-light text-lg">لا توجد امتحانات سابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
            {student.exam_stats.results.map((exam: any, index: number) => (
              <DashboardCard
                key={index}
                title={exam.exam_title}
                action={
                  <div className="flex items-center gap-2">
                    <span className={exam.percentage >= 50 ? 'badge badge-success' : 'badge badge-danger'}>
                      {exam.percentage >= 50 ? 'ناجح' : 'راسب'}
                    </span>
                    <button 
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-not-allowed opacity-50"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                }
              >
                <div className="mb-4">
                  <p className="text-sm text-gray-light mb-4">
                    {exam.description || 'تفاصيل الامتحان ونتائج الطالب'}
                  </p>

                  <div className="grid gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <i className="fas fa-star w-5 text-primary"></i>
                      <span>الدرجة: {exam.score} / {exam.max_score}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <i className="fas fa-percent w-5 text-primary"></i>
                      <span>النسبة: {exam.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <i className="fas fa-calendar w-5 text-primary"></i>
                      <span>{new Date(exam.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>

                  {/* Buttons removed as per request */}
                  {/* <div className="flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm flex-1" 
                      onClick={() => router.push(`/teacher/exams/${exam.exam_id}`)}
                    >
                      <i className="fas fa-eye"></i>
                      <span>عرض</span>
                    </button>
                    <button className="btn btn-outline btn-sm flex-1">
                      <i className="fas fa-file-alt"></i>
                      <span>تقرير</span>
                    </button>
                  </div> */}
                </div>
              </DashboardCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

