'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { toast } from 'react-hot-toast';
import {
  getReportTeachers,
  getReportAcademies,
  getTeacherReport,
  getAcademyReport,
  getAdminReport,
  downloadTeacherReportPdf,
  downloadAcademyReportPdf,
  downloadAdminReportPdf,
  getDateRangeFromPreset,
  getPeriodPresetLabel,
  type PeriodPreset,
} from '@/services/admin/reportService';
import type {
  TeacherListItem,
  AcademyListItem,
  TeacherReportData,
  AcademyReportData,
  AdminReportData,
} from '@/types/admin.types';

type ReportType = 'admin' | 'teacher' | 'academy';

function ReportsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven state
  const [reportType, setReportType] = useState<ReportType>('admin');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last_month');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>('');

  // Data state
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [academies, setAcademies] = useState<AcademyListItem[]>([]);
  const [report, setReport] = useState<TeacherReportData | AcademyReportData | AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync state from URL on mount
  useEffect(() => {
    const type = searchParams.get('type') as ReportType | null;
    const preset = searchParams.get('preset') as PeriodPreset | null;
    const teacherId = searchParams.get('teacher_id');
    const academyId = searchParams.get('academy_id');

    if (type && ['admin', 'teacher', 'academy'].includes(type)) {
      setReportType(type);
    }
    if (preset && ['last_month', 'last_3_months', 'last_6_months', 'last_year', 'custom'].includes(preset)) {
      setPeriodPreset(preset);
    }
    if (teacherId) setSelectedTeacherId(teacherId);
    if (academyId) setSelectedAcademyId(academyId);
  }, [searchParams]);

  // Update URL when state changes
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Fetch teachers list when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const fetchTeachers = async () => {
      try {
        const data = await getReportTeachers();
        setTeachers(data);
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
        // Don't show error toast for 401 - user just needs to login
        if ((error as { statusCode?: number }).statusCode !== 401) {
          toast.error('فشل تحميل قائمة المدرسين');
        }
      }
    };
    fetchTeachers();
  }, [user]);

  // Fetch academies list on mount
  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        const data = await getReportAcademies();
        setAcademies(data);
      } catch (error) {
        console.error('Failed to fetch academies:', error);
        toast.error('فشل تحميل قائمة الأكاديميات');
      }
    };
    fetchAcademies();
  }, []);

  // Generate report
  const handleGenerateReport = async () => {
    if (reportType === 'teacher' && !selectedTeacherId) {
      toast.error('يرجى اختيار مدرس');
      return;
    }

    if (reportType === 'academy' && !selectedAcademyId) {
      toast.error('يرجى اختيار أكاديمية');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const params = getDateRangeFromPreset(periodPreset);

      let data;
      if (reportType === 'admin') {
        data = await getAdminReport(params);
      } else if (reportType === 'academy') {
        data = await getAcademyReport(selectedAcademyId, params);
      } else {
        data = await getTeacherReport(selectedTeacherId, params);
      }

      setReport(data);
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('فشل إنشاء التقرير');
    } finally {
      setIsLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!report) {
      toast.error('يرجى إنشاء التقرير أولاً');
      return;
    }

    setIsDownloading(true);

    try {
      const params = getDateRangeFromPreset(periodPreset);

      if (reportType === 'admin') {
        await downloadAdminReportPdf(params);
      } else if (reportType === 'academy') {
        await downloadAcademyReportPdf(selectedAcademyId, params);
      } else {
        await downloadTeacherReportPdf(selectedTeacherId, params);
      }

      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('فشل تحميل التقرير');
    } finally {
      setIsDownloading(false);
    }
  };

  // Teachers breakdown columns with subscription_fee
  const teachersColumns = [
    { key: 'name', label: 'الاسم', sortable: true },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (value: string) => (
        <span className={`badge ${value === 'نشط' ? 'badge-success' : 'badge-danger'}`}>
          {value}
        </span>
      ),
    },
    { key: 'total_students', label: 'إجمالي الطلاب', sortable: true },
    { key: 'active_students', label: 'النشطين', sortable: true },
    {
      key: 'subscription_fee',
      label: 'السعر المدفوع للمنصة',
      sortable: true,
      render: (value: number) => (
        <span className="text-primary font-semibold">
          {(value || 0).toLocaleString()} ج.م
        </span>
      ),
    },
    {
      key: 'revenue',
      label: 'الإيرادات',
      sortable: true,
      render: (value: number) => (
        <span className="text-secondary font-semibold">
          {value.toLocaleString()} ج.م
        </span>
      ),
    },
    {
      key: 'paid',
      label: 'المدفوع',
      sortable: true,
      render: (value: number) => (
        <span className="text-success font-semibold">
          {(value || 0).toLocaleString()} ج.م
        </span>
      ),
    },
  ];

  // Subscription breakdown columns
  const subscriptionColumns = [
    { key: 'month_name', label: 'الشهر', sortable: true },
    { key: 'student_count', label: 'عدد الطلاب', sortable: true },
    {
      key: 'amount_due',
      label: 'المبلغ المستحق',
      sortable: true,
      render: (value: number) => (
        <span className="text-white font-medium">
          {value.toLocaleString()} ج.م
        </span>
      ),
    },
    {
      key: 'amount_paid',
      label: 'المدفوع',
      sortable: true,
      render: (value: number) => (
        <span className="text-success font-medium">
          {value.toLocaleString()} ج.م
        </span>
      ),
    },
    {
      key: 'amount_remaining',
      label: 'المتبقي',
      sortable: true,
      render: (value: number) => (
        <span className="text-danger font-medium">
          {value.toLocaleString()} ج.م
        </span>
      ),
    },
    {
      key: 'status',
      label: 'حالة الدفع',
      sortable: true,
      render: (value: string) => {
        let badgeClass = 'badge-danger';
        let text = 'غير مدفوع';

        if (value === 'paid') {
          badgeClass = 'badge-success';
          text = 'مدفوع';
        } else if (value === 'partial') {
          badgeClass = 'badge-warning';
          text = 'مدفوع جزئياً';
        }

        return <span className={`badge ${badgeClass}`}>{text}</span>;
      },
    },
  ];

  return (
    <DashboardLayout role="admin" user={user || undefined}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fas fa-chart-bar text-primary"></i>
          التقارير
        </h1>

        {/* Filters Card */}
        <DashboardCard title="خيارات التقرير" icon="fas fa-filter" className="mb-6">
          <div className="space-y-6">
            {/* Report Type Selection */}
            <div>
              <label className="block text-gray-300 mb-3 text-sm font-medium">نوع التقرير</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'admin', label: 'التقرير العام', icon: 'fa-chart-pie' },
                  { value: 'teacher', label: 'تقرير مدرس', icon: 'fa-chalkboard-teacher' },
                  { value: 'academy', label: 'تقرير أكاديمية', icon: 'fa-building' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setReportType(type.value as ReportType);
                      setReport(null);
                      updateUrlParams({ type: type.value, teacher_id: null, academy_id: null });
                    }}
                    className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                      reportType === type.value
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <i className={`fas ${type.icon}`}></i>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher Selection */}
            {reportType === 'teacher' && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">اختر المدرس</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    setReport(null);
                    updateUrlParams({ teacher_id: e.target.value || null });
                  }}
                  className="w-full md:w-1/2 p-3 bg-[#1a1f37] border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
                  disabled={!teachers || teachers.length === 0}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-[#1a1f37] text-white">-- اختر مدرس --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id} className="bg-[#1a1f37] text-white">
                      {teacher.name} ({teacher.subscription_fee > 0 ? `${teacher.subscription_fee.toLocaleString()} ج.م` : 'لا يوجد باقة'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Academy Selection */}
            {reportType === 'academy' && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">اختر الأكاديمية</label>
                <select
                  value={selectedAcademyId}
                  onChange={(e) => {
                    setSelectedAcademyId(e.target.value);
                    setReport(null);
                    updateUrlParams({ academy_id: e.target.value || null });
                  }}
                  className="w-full md:w-1/2 p-3 bg-[#1a1f37] border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
                  disabled={!academies || academies.length === 0}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-[#1a1f37] text-white">-- اختر أكاديمية --</option>
                  {academies.map((academy) => (
                    <option key={academy.id} value={academy.id} className="bg-[#1a1f37] text-white">
                      {academy.name} ({academy.subscription_fee > 0 ? `${academy.subscription_fee.toLocaleString()} ج.م` : 'لا يوجد باقة'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-alt"></i>
                    إنشاء التقرير
                  </>
                )}
              </button>

              {report && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="px-6 py-3 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download"></i>
                      تحميل PDF
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Report Results */}
        {report && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Teacher Report Summary */}
              {'teacher' in report && (
                <>
                  <DashboardCard title="الطلاب" icon="fas fa-users" className="bg-white/5">
                    <div className="text-3xl font-bold text-white">
                      {report.summary.total_students}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.active_students} نشط
                    </div>
                  </DashboardCard>
                  <DashboardCard title="السعر المدفوع للمنصة" icon="fas fa-money-bill-wave" className="bg-primary/10 border-primary/30">
                    <div className="text-3xl font-bold text-primary">
                      {(report.financial_details?.total_revenue || 0).toLocaleString()} ج.م
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.new_enrollments} شهر
                    </div>
                  </DashboardCard>
                </>
              )}

              {/* Academy Report Summary */}
              {'academy' in report && (
                <>
                  <DashboardCard title="المدرسين" icon="fas fa-chalkboard-teacher" className="bg-white/5">
                    <div className="text-3xl font-bold text-white">
                      {report.summary.total_teachers}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.active_teachers} نشط
                    </div>
                  </DashboardCard>
                  <DashboardCard title="الطلاب" icon="fas fa-users" className="bg-white/5">
                    <div className="text-3xl font-bold text-white">
                      {report.summary.total_academy_students}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.total_enrollments} تسجيل
                    </div>
                  </DashboardCard>
                  <DashboardCard title="السعر المدفوع للمنصة" icon="fas fa-money-bill-wave" className="bg-primary/10 border-primary/30">
                    <div className="text-3xl font-bold text-primary">
                      {report.summary.subscription_fee.toLocaleString()} ج.م
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.total_subscriptions} اشتراك
                    </div>
                  </DashboardCard>
                  <DashboardCard title="حالة الدفع" icon="fas fa-info-circle" className="bg-white/5">
                    <div className={`text-2xl font-bold ${
                      report.summary.payment_status === 'paid' ? 'text-success' :
                      report.summary.payment_status === 'partial' ? 'text-warning' : 'text-danger'
                    }`}>
                      {report.summary.payment_status === 'paid' ? 'مدفوع' :
                       report.summary.payment_status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.remaining_balance.toLocaleString()} ج.م متبقي
                    </div>
                  </DashboardCard>
                </>
              )}

              {/* Academy Additional Info */}
              {'academy' in report && (
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  {/* DEBUG - REMOVE LATER */}
                  {(() => { console.log('[DEBUG] report.academy:', JSON.stringify(report.academy)); return null; })()}
                  {/* Plan Type */}
                  <DashboardCard title="الباقة الحالية" icon="fas fa-crown" className="bg-yellow-500/10 border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-400">
                      {report.academy.plan_type === 'trial' ? 'فترة تجريبية' :
                       report.academy.plan_type === 'term' ? 'باقة فصلية' :
                       report.academy.plan_type === 'custom' ? 'باقة مخصصة' :
                       report.academy.plan_type ? report.academy.plan_type : 'بدون باقة'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.price_per_student} ج.م / طالب
                    </div>
                  </DashboardCard>

                  {/* Allowed Students */}
                  <DashboardCard title="الطلاب المسموح بهم" icon="fas fa-user-friends" className="bg-blue-500/10 border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">
                      {report.academy.is_unlimited_students ? 'غير محدود' : (report.academy.plan_max_students || 0)}
                    </div>
                    <div className="text-sm text-gray-400">
                      الطلاب الحاليين: {report.summary.total_academy_students}
                    </div>
                  </DashboardCard>

                  {/* Usage Percentage */}
                  <DashboardCard title="نسبة استخدام الباقة" icon="fas fa-chart-pie" className="bg-cyan-500/10 border-cyan-500/30">
                    <div className="text-2xl font-bold text-cyan-400">
                      {report.academy.is_unlimited_students
                        ? '∞'
                        : report.academy.plan_max_students && report.academy.plan_max_students > 0
                          ? `${Math.round((report.summary.total_academy_students / report.academy.plan_max_students) * 100)}%`
                          : '0%'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.total_academy_students} / {report.academy.is_unlimited_students ? '∞' : (report.academy.plan_max_students || 0)} طالب
                    </div>
                  </DashboardCard>

                  {/* Teachers Count */}
                  <DashboardCard title="عدد المدرسين" icon="fas fa-chalkboard-teacher" className="bg-purple-500/10 border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400">
                      {report.academy.total_teachers || report.summary.total_teachers}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.academy.active_teachers || report.summary.active_teachers} مدرس نشط
                    </div>
                  </DashboardCard>

                  {/* Join Date */}
                  <DashboardCard title="تاريخ الانضمام للمنصة" icon="fas fa-calendar-alt" className="bg-white/5">
                    <div className="text-2xl font-bold text-white">
                      {report.academy.joined}
                    </div>
                    <div className="text-sm text-gray-400">
                      عضو منذ {report.academy.member_since_days || 0} يوم
                    </div>
                  </DashboardCard>

                  {/* Payment Status */}
                  <DashboardCard title="تاريخ آخر دفعة" icon="fas fa-receipt" className={
                    report.academy.has_subscription
                      ? (report.academy.amount_due ?? 0) <= 0
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }>
                    <div className={`text-xl font-bold ${
                      report.academy.has_subscription
                        ? (report.academy.amount_due ?? 0) <= 0
                          ? 'text-green-400'
                          : 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {report.academy.has_subscription ? 'تم الدفع' : 'لم يتم الدفع'}
                      {!report.academy.has_subscription && (
                        <span className="text-xs mr-2 bg-red-500/20 text-red-400 px-2 py-1 rounded">⚠ مطلوب الدفع</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.academy.subscription_expiry
                        ? `تنتهي: ${report.academy.subscription_expiry}`
                        : report.academy.has_subscription
                          ? ((report.academy.amount_due ?? 0) > 0
                            ? `المتبقي: ${(report.academy.amount_due ?? 0).toLocaleString()} ج.م`
                            : 'مدفوع بالكامل')
                          : `المطلوب: ${(report.summary.subscription_fee || 0).toLocaleString()} ج.م`
                      }
                    </div>
                  </DashboardCard>

                  {/* Remaining Days until Plan Expiry */}
                  {(() => {
                    const daysRemaining = report.academy.days_remaining ?? null;
                    return (
                      <DashboardCard
                        title="المتبقي على انتهاء الباقة"
                        icon="fas fa-hourglass-half"
                        className={
                          daysRemaining === null ? 'bg-white/5' :
                          daysRemaining <= 7 ? 'bg-red-500/10 border-red-500/30' :
                          daysRemaining <= 30 ? 'bg-yellow-500/10 border-yellow-500/30' :
                          'bg-green-500/10 border-green-500/30'
                        }
                      >
                        <div className={`text-2xl font-bold ${
                          daysRemaining === null ? 'text-gray-400' :
                          daysRemaining <= 7 ? 'text-red-400' :
                          daysRemaining <= 30 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {daysRemaining !== null
                            ? `${daysRemaining} يوم`
                            : 'غير محدد'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {report.academy.subscription_expiry
                            ? `تنتهي في ${report.academy.subscription_expiry}`
                            : 'لا يوجد تاريخ انتهاء'}
                        </div>
                      </DashboardCard>
                    );
                  })()}

                  {/* Payment Progress */}
                  {(() => {
                    const pct = report.academy.payment_percentage ?? 0;
                    return (
                      <DashboardCard title="نسبة الدفع" icon="fas fa-money-check-alt" className={
                        pct >= 100 ? 'bg-green-500/10 border-green-500/30' :
                        pct > 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-red-500/10 border-red-500/30'
                      }>
                        <div className={`text-2xl font-bold ${
                          pct >= 100 ? 'text-green-400' :
                          pct > 0 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {pct}%
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              pct >= 100 ? 'bg-green-500' :
                              pct > 0 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {(report.academy.paid_amount ?? 0).toLocaleString()} / {(report.summary.subscription_fee || 0).toLocaleString()} ج.م
                        </div>
                      </DashboardCard>
                    );
                  })()}
                </div>
              )}

              {/* Admin Report Summary */}
              {'summary' in report && !('teacher' in report) && !('academy' in report) && (
                <>
                  <DashboardCard title="إجمالي المدرسين" icon="fas fa-chalkboard-teacher" className="bg-white/5">
                    <div className="text-3xl font-bold text-white">
                      {report.summary.total_teachers}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.active_teachers} نشط | {report.summary.suspended_teachers} معلق
                    </div>
                  </DashboardCard>
                  <DashboardCard title="إجمالي الطلاب" icon="fas fa-users" className="bg-white/5">
                    <div className="text-3xl font-bold text-white">
                      {report.summary.total_students}
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.new_students} جديد في الفترة
                    </div>
                  </DashboardCard>
                  <DashboardCard title="إجمالي رسوم الاشتراكات" icon="fas fa-money-bill-wave" className="bg-primary/10 border-primary/30">
                    <div className="text-3xl font-bold text-primary">
                      {report.summary.total_subscription_fees.toLocaleString()} ج.م
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.total_subscriptions} اشتراك
                    </div>
                  </DashboardCard>
                  <DashboardCard title="صافي ربح المنصة" icon="fas fa-chart-line" className="bg-success/10 border-success/30">
                    <div className="text-3xl font-bold text-success">
                      {report.summary.net_platform_profit.toLocaleString()} ج.م
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.summary.independent_commission.toLocaleString()} مدرسين | {report.summary.academy_platform_share.toLocaleString()} أكاديميات
                    </div>
                  </DashboardCard>
                </>
              )}
            </div>

            {/* Teacher Plan Info */}
            {'teacher' in report && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <DashboardCard title="الباقة الحالية" icon="fas fa-crown" className="bg-yellow-500/10 border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    {report.teacher.plan_type === 'trial' ? 'فترة تجريبية' :
                     report.teacher.plan_type === 'term' ? 'باقة فصلية' :
                     report.teacher.plan_type === 'custom' ? 'باقة مخصصة' :
                     report.teacher.plan_type ? report.teacher.plan_type : 'بدون باقة'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.summary.price_per_student} ج.م / طالب
                  </div>
                </DashboardCard>

                <DashboardCard title="الطلاب المسموح بهم" icon="fas fa-users-cog" className="bg-blue-500/10 border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {report.teacher.is_unlimited_students ? 'غير محدود' : (report.teacher.plan_max_students || 0)}
                  </div>
                  <div className="text-sm text-gray-400">
                    الطلاب الحاليين: {report.summary.total_students}
                  </div>
                </DashboardCard>

                <DashboardCard title="نسبة استخدام الباقة" icon="fas fa-chart-pie" className="bg-purple-500/10 border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400">
                    {report.teacher.is_unlimited_students ? '-' :
                     report.teacher.plan_max_students && report.teacher.plan_max_students > 0
                       ? `${Math.min(Math.round((report.summary.total_students / report.teacher.plan_max_students) * 100), 100)}%`
                       : '0%'}
                  </div>
                  {!report.teacher.is_unlimited_students && report.teacher.plan_max_students && report.teacher.plan_max_students > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((report.summary.total_students / report.teacher.plan_max_students) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </DashboardCard>
              </div>
            )}

            {/* Teacher Additional Info */}
            {'teacher' in report && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <DashboardCard title="تاريخ الانضمام للمنصة" icon="fas fa-calendar-alt" className="bg-white/5">
                  <div className="text-2xl font-bold text-white">
                    {report.teacher.joined || '-'}
                  </div>
                  <div className="text-sm text-gray-400">
                    عضو منذ {report.teacher.member_since_days ?? 0} يوم
                  </div>
                </DashboardCard>

                <DashboardCard title="عدد السكرتارية" icon="fas fa-user-tie" className="bg-white/5">
                  <div className="text-2xl font-bold text-white">
                    {report.teacher.total_secretaries || 0}
                  </div>
                  <div className="text-sm text-gray-400">
                    سكرتير مساعد
                  </div>
                </DashboardCard>

                <DashboardCard title="تاريخ آخر دفعة" icon="fas fa-credit-card" className={report.teacher.has_subscription ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${report.teacher.has_subscription ? 'text-green-400' : 'text-red-400'}`}>
                      {report.teacher.last_payment_date || (report.teacher.has_subscription ? 'تم الدفع' : 'لم يتم الدفع')}
                    </div>
                    {report.teacher.has_subscription ? (
                      <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                        ✓ مدفوع {report.teacher.paid_amount ? `${report.teacher.paid_amount.toLocaleString()} ج.م` : ''}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                        ⚠ مطلوب الدفع
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.teacher.subscription_expiry
                      ? `تنتهي: ${report.teacher.subscription_expiry}`
                      : report.teacher.has_subscription
                        ? ((report.teacher.amount_due ?? 0) > 0
                          ? `المتبقي: ${(report.teacher.amount_due ?? 0).toLocaleString()} ج.م`
                          : 'مدفوع بالكامل')
                        : `المطلوب: ${(report.financial_details?.total_revenue || 0).toLocaleString()} ج.م`
                    }
                  </div>
                </DashboardCard>

                {/* Remaining Days until Plan Expiry */}
                {(() => {
                  const daysRemaining = report.teacher.days_remaining ?? null;
                  return (
                    <DashboardCard
                      title="المتبقي على انتهاء الباقة"
                      icon="fas fa-hourglass-half"
                      className={
                        daysRemaining === null ? 'bg-white/5' :
                        daysRemaining <= 7 ? 'bg-red-500/10 border-red-500/30' :
                        daysRemaining <= 30 ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-green-500/10 border-green-500/30'
                      }
                    >
                      <div className={`text-2xl font-bold ${
                        daysRemaining === null ? 'text-gray-400' :
                        daysRemaining <= 7 ? 'text-red-400' :
                        daysRemaining <= 30 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {daysRemaining !== null
                          ? `${daysRemaining} يوم`
                          : 'غير محدد'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {report.teacher.subscription_expiry
                          ? `تنتهي في ${report.teacher.subscription_expiry}`
                          : 'لا يوجد تاريخ انتهاء'}
                      </div>
                    </DashboardCard>
                  );
                })()}

                {/* Plan Duration */}
                <DashboardCard title="مدة الباقة" icon="fas fa-calendar-check" className="bg-indigo-500/10 border-indigo-500/30">
                  <div className="text-2xl font-bold text-indigo-400">
                    {report.teacher.plan_duration_months
                      ? `${report.teacher.plan_duration_months} شهر`
                      : 'غير محدد'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.teacher.plan_type === 'trial' ? 'فترة تجريبية' : 'مدة الاشتراك'}
                  </div>
                </DashboardCard>

                {/* Payment Progress */}
                {(() => {
                  const pct = report.teacher.payment_percentage ?? 0;
                  return (
                    <DashboardCard title="نسبة الدفع" icon="fas fa-money-check-alt" className={
                      pct >= 100 ? 'bg-green-500/10 border-green-500/30' :
                      pct > 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-red-500/10 border-red-500/30'
                    }>
                      <div className={`text-2xl font-bold ${
                        pct >= 100 ? 'text-green-400' :
                        pct > 0 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {pct}%
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pct >= 100 ? 'bg-green-500' :
                            pct > 0 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {report.teacher.paid_amount?.toLocaleString() || 0} / {(report.financial_details?.total_revenue || 0).toLocaleString()} ج.م
                      </div>
                    </DashboardCard>
                  );
                })()}
              </div>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-white">جاري التحميل...</div>
    </div>}>
      <ReportsPageContent />
    </Suspense>
  );
}

export default withAdminAuth(ReportsPage);
