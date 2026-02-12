'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getTeacherDetails } from '@/services/admin/adminService';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { SubscriptionCard } from '@/components/admin/teachers/SubscriptionCard';
import { BillingCard } from '@/components/admin/teachers/BillingCard';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { Skeleton } from '@/components/ui';

export default function TeacherDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getTeacherDetails(params.id as string);
        // adminService returns { teacher: AdminTeacher }
        setTeacher(data.teacher || data);
      } catch (err: any) {
        setError(err.message || 'فشل جلب بيانات المدرس');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchTeacherDetails();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <DashboardLayout role="admin" user={user || undefined}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5 h-40 flex flex-col items-center justify-center">
              <Skeleton className="h-16 w-16 rounded-full mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5 mb-8">
          <div className="dashboard-card-header">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 mb-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !teacher) {
    return (
      <DashboardLayout role="admin" user={user || undefined}>
        <div className="alert alert-danger">{error || 'المدرس غير موجود'}</div>
        <button className="btn btn-primary mt-3" onClick={() => router.back()}>
          عودة
        </button>
      </DashboardLayout>
    );
  }

  const studentColumns = [
    { key: 'id', label: '#', render: (_: any, __: any, index: number) => index + 1 },
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'username', label: 'اسم المستخدم', sortable: true },
    { key: 'created_at', label: 'تاريخ الانضمام', sortable: true, render: (val: string) => new Date(val).toLocaleDateString('ar-EG') },
  ];

  const secretaryColumns = [
    { key: 'id', label: '#', render: (_: any, __: any, index: number) => index + 1 },
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'created_at', label: 'تاريخ الانضمام', sortable: true, render: (val: string) => new Date(val).toLocaleDateString('ar-EG') },
  ];

  const calculateTimeSince = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
  };

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
      headerActions={
        <button className="btn btn-outline" onClick={() => router.back()}>
          <i className="fas fa-arrow-right"></i>
          <span>عودة للقائمة</span>
        </button>
      }
    >
      {/* Teacher Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <DashboardCard className="text-center flex flex-col justify-center items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 text-[2rem] text-white font-bold shadow-lg shadow-primary/20">
            {teacher.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-white text-2xl mb-2 font-bold">{teacher.name}</h3>
          <p className="text-gray-400">{teacher.phone || teacher.username}</p>
          {teacher.subject && (
            <p className="text-primary text-sm mt-1">
              <i className="fas fa-book ml-1"></i>
              {teacher.subject}
            </p>
          )}
        </DashboardCard>

        <StatCard
          title="عدد الطلاب"
          value={teacher.students_count || 0}
          icon="fas fa-users"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="عدد السكرتارية"
          value={teacher.secretaries_count || 0}
          icon="fas fa-user-tie"
          color="success"
          variant="centered"
        />

        <DashboardCard className="text-center flex flex-col justify-center items-center">
          <i className="fas fa-calendar-alt text-[2.5rem] text-warning mb-3"></i>
          <h3 className="text-[1.2rem] font-bold text-white mb-2">
            {teacher.joined || (teacher.created_at && new Date(teacher.created_at).toLocaleDateString('ar-EG'))}
          </h3>
          <p className="text-gray-400 text-[0.95rem] mb-1">تاريخ الانضمام</p>
          <p className="text-primary text-[0.85rem] m-0 font-medium bg-primary/10 px-3 py-1 rounded-full">
            {teacher.created_at ? calculateTimeSince(teacher.created_at) : '-'}
          </p>
        </DashboardCard>
      </div>

      {/* Subscription Card - Only show if teacher has a plan */}
      {teacher.plan_type && (
        <SubscriptionCard teacher={teacher} />
      )}

      {/* Billing Card */}
      <BillingCard teacher={teacher} />

      {/* Students Table */}
      <DashboardCard
        title="قائمة الطلاب"
        icon="fas fa-users"
        className="mb-8"
      >
        <DataTable
          columns={studentColumns}
          data={teacher.students || []}
          searchable={true}
          pagination={true}
          itemsPerPage={5}
        />
      </DashboardCard>

      {/* Secretaries Table */}
      <DashboardCard
        title="قائمة السكرتارية"
        icon="fas fa-user-tie"
      >
        <DataTable
          columns={secretaryColumns}
          data={teacher.secretaries || []}
          searchable={true}
          pagination={true}
          itemsPerPage={5}
        />
      </DashboardCard>
    </DashboardLayout>
  );
}
