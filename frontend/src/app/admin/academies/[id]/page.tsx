'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getAcademyDetails } from '@/services/authService';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui';

export default function AcademyDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [academy, setAcademy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAcademyDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getAcademyDetails(params.id as string);
        setAcademy(data);
      } catch (err: any) {
        setError(err.message || 'فشل جلب بيانات الأكاديمية');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchAcademyDetails();
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

  if (error || !academy) {
    return (
      <DashboardLayout role="admin" user={user || undefined}>
        <div className="alert alert-danger">{error || 'الأكاديمية غير موجودة'}</div>
        <button className="btn btn-primary mt-3" onClick={() => router.back()}>
          عودة
        </button>
      </DashboardLayout>
    );
  }

  const teacherColumns = [
    { key: 'id', label: '#', render: (_: any, __: any, index: number) => index + 1 },
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'students_count', label: 'عدد الطلاب', sortable: true },
    { key: 'created_at', label: 'تاريخ الانضمام', sortable: true, render: (val: string) => new Date(val).toLocaleDateString('ar-EG') },
  ];

  const secretaryColumns = [
    { key: 'id', label: '#', render: (_: any, __: any, index: number) => index + 1 },
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'created_at', label: 'تاريخ الانضمام', sortable: true, render: (val: string) => new Date(val).toLocaleDateString('ar-EG') },
  ];

  const billingColumns = [
    { key: 'id', label: '#', render: (_: any, __: any, index: number) => index + 1 },
    { key: 'month', label: 'الشهر', sortable: true, render: (val: number) => `${val}` },
    { key: 'year', label: 'السنة', sortable: true },
    { key: 'teachers_count', label: 'عدد المدرسين', sortable: true },
    { key: 'amount_due', label: 'المبلغ المستحق', sortable: true, render: (val: number) => `$${val}` },
    { 
      key: 'status', 
      label: 'الحالة', 
      sortable: true,
      render: (val: string) => (
        <span className={`badge ${
          val === 'paid' ? 'badge-success' : 
          val === 'pending' ? 'badge-warning' : 
          'badge-danger'
        }`}>
          {val === 'paid' ? 'مدفوعة' : val === 'pending' ? 'قيد الانتظار' : 'ملغاة'}
        </span>
      )
    },
  ];

  const calculateTimeSince = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
  };

  // Calculate total students across all teachers
  const totalStudents = academy.teachers?.reduce((sum: number, teacher: any) => {
    return sum + (teacher.students_count || 0);
  }, 0) || 0;

  // Get price per student from settings (default to 20 if not available)
  const pricePerStudent = academy.price_per_student || 20;

  // Calculate total revenue
  const totalRevenue = totalStudents * pricePerStudent;

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
     
    >
      {/* Academy Info Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-8">
        <DashboardCard className="text-center flex flex-col justify-center items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 text-[2rem] text-white font-bold shadow-lg shadow-primary/20">
            {academy.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-white text-2xl mb-2 font-bold">{academy.name}</h3>
          <p className="text-gray-400">{academy.phone}</p>
          {academy.address && (
            <p className="text-gray-500 text-sm mt-2">
              <i className="fas fa-map-marker-alt ml-1"></i>
              {academy.address}
            </p>
          )}
        </DashboardCard>

        <StatCard
          title="عدد المدرسين"
          value={academy.teachers_count || 0}
          icon="fas fa-chalkboard-teacher"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="عدد السكرتارية"
          value={academy.secretaries_count || 0}
          icon="fas fa-user-tie"
          color="success"
          variant="centered"
        />

        <StatCard
          title="إجمالي الطلاب"
          value={totalStudents}
          icon="fas fa-users"
          color="warning"
          variant="centered"
        />

        <StatCard
          title="إجمالي الإيرادات"
          value={totalRevenue}
          icon="fas fa-dollar-sign"
          color="danger"
          prefix="$"
          variant="centered"
        />

        <DashboardCard className="text-center flex flex-col justify-center items-center">
          <i className="fas fa-calendar-alt text-[2.5rem] text-warning mb-3"></i>
          <h3 className="text-[1.2rem] font-bold text-white mb-2">
            {new Date(academy.created_at).toLocaleDateString('ar-EG')}
          </h3>
          <p className="text-gray-400 text-[0.95rem] mb-1">تاريخ الإنشاء</p>
          <p className="text-primary text-[0.85rem] m-0 font-medium bg-primary/10 px-3 py-1 rounded-full">
            {calculateTimeSince(academy.created_at)}
          </p>
        </DashboardCard>
      </div>

      {/* Status Card */}
      <DashboardCard className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-lg font-bold mb-2">حالة الأكاديمية</h3>
            <p className="text-gray-400">الحالة الحالية للأكاديمية في النظام</p>
          </div>
          <span className={`badge ${academy.is_active ? 'badge-success' : 'badge-danger'} text-lg px-4 py-2`}>
            {academy.is_active ? 'نشط' : 'معطل'}
          </span>
        </div>
      </DashboardCard>

      {/* Teachers Table */}
      <DashboardCard
        title="قائمة المدرسين"
        icon="fas fa-chalkboard-teacher"
        className="mb-8"
      >
        <DataTable
          columns={teacherColumns}
          data={academy.teachers || []}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </DashboardCard>

      {/* Secretaries Table */}
      <DashboardCard
        title="قائمة السكرتارية"
        icon="fas fa-user-tie"
        className="mb-8"
      >
        <DataTable
          columns={secretaryColumns}
          data={academy.secretaries || []}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </DashboardCard>

      {/* Billing History Table */}
      <DashboardCard
        title="سجل الفواتير"
        icon="fas fa-file-invoice-dollar"
      >
        <DataTable
          columns={billingColumns}
          data={academy.billings || []}
          searchable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </DashboardCard>
    </DashboardLayout>
  );
}
