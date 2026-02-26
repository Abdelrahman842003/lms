'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { LoadingSpinner, Button, Icon, Input } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'react-hot-toast';
import {
  getMyTeacherReport,
  downloadMyTeacherReportPdf,
  ReportParams,
} from '@/services/authService';
import type { TeacherReportData } from '@/types/teacher.types';

type PeriodPreset = 'today' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';

export default function TeacherReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [report, setReport] = useState<TeacherReportData | null>(null);

  // Calculate date range based on preset
  const getDateRange = (): ReportParams => {
    const today = new Date();
    let startDate: Date;
    const endDate = today;

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (periodPreset) {
      case 'today':
        startDate = today;
        break;
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_3_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        break;
      case 'last_6_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        break;
      case 'last_year':
        startDate = new Date(today.getFullYear() - 1, today.getMonth() + 1, 1);
        break;
      case 'custom':
        return {
          start_date: customStartDate,
          end_date: customEndDate,
        };
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (periodPreset === 'custom' && (!customStartDate || !customEndDate)) {
      toast.error('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const params = getDateRange();
      const data = await getMyTeacherReport(params);
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
      const params = getDateRange();
      await downloadMyTeacherReportPdf(params);
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('فشل تحميل التقرير');
    } finally {
      setIsDownloading(false);
    }
  };

  const periodPresets = [
    { value: 'today', label: 'اليوم' },
    { value: 'last_month', label: 'الشهر الحالي' },
    { value: 'last_3_months', label: 'آخر 3 شهور' },
    { value: 'last_6_months', label: 'آخر 6 شهور' },
    { value: 'last_year', label: 'آخر سنة' },
    { value: 'custom', label: 'مخصص' },
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
        <span className="text-white font-medium">{value.toLocaleString()} ج.م</span>
      ),
    },
    {
      key: 'amount_paid',
      label: 'المدفوع',
      sortable: true,
      render: (value: number) => (
        <span className="text-success font-medium">{value.toLocaleString()} ج.م</span>
      ),
    },
    {
      key: 'amount_remaining',
      label: 'المتبقي',
      sortable: true,
      render: (value: number) => (
        <span className="text-danger font-medium">{value.toLocaleString()} ج.م</span>
      ),
    },
    {
      key: 'status_label',
      label: 'حالة الدفع',
      sortable: true,
      render: (value: string, row: { status: string }) => {
        let badgeClass = 'badge-danger';
        if (row.status === 'paid') badgeClass = 'badge-success';
        else if (row.status === 'partial') badgeClass = 'badge-warning';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      },
    },
  ];

  return (
    <DashboardLayout role={user?.userType as 'teacher' | 'secretary' || 'teacher'} user={user || undefined}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Icon name="chart" className="text-primary" />
          التقارير
        </h1>

        {/* Filters Card */}
        <DashboardCard title="خيارات التقرير" icon="fas fa-filter" className="mb-6">
          <div className="space-y-6">
            {/* Period Selection */}
            <div>
              <label className="block text-gray-300 mb-3 text-sm font-medium">الفترة الزمنية</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {periodPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={periodPreset === preset.value ? 'primary' : 'outline'}
                    onClick={() => {
                      setPeriodPreset(preset.value as PeriodPreset);
                      setReport(null);
                    }}
                    className="px-4 py-2 text-sm"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Range */}
              {periodPreset === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <label className="block text-gray-400 mb-2 text-sm">من تاريخ</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2 text-sm">إلى تاريخ</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="primary"
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="px-6 py-3 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="ml-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Icon name="file-alt" />
                    إنشاء التقرير
                  </>
                )}
              </Button>

              {report && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="px-6 py-3 flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="ml-2" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <Icon name="download" />
                      تحميل PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Report Results */}
        {report && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <DashboardCard title="الطلاب" icon="fas fa-users" className="bg-white/5">
                <div className="text-3xl font-bold text-white">
                  {report.summary.total_students}
                </div>
                <div className="text-sm text-gray-400">
                  {report.summary.active_students} نشط | {report.summary.total_students - report.summary.active_students} غير نشط
                </div>
              </DashboardCard>

              {/* Subscription Fee - Primary Metric */}
              <DashboardCard
                title="السعر المدفوع للمنصة"
                icon="fas fa-money-bill-wave"
                className="bg-primary/10 border-primary/30"
              >
                <div className="text-3xl font-bold text-primary">
                  {report.summary.subscription_fee?.toLocaleString() || 0} ج.م
                </div>
                <div className="text-sm text-gray-400">
                  سعر الاشتراك الشهري
                </div>
              </DashboardCard>

              {/* Confirmed Payments */}
              <DashboardCard
                title="المدفوع"
                icon="fas fa-check-circle"
                className="bg-success/10 border-success/30"
              >
                <div className="text-3xl font-bold text-success">
                  {report.summary.confirmed_payments?.toLocaleString() || 0} ج.م
                </div>
                <div className="text-sm text-gray-400">
                  {report.summary.paying_students_count} طالب دفع
                </div>
              </DashboardCard>

              {/* Remaining Balance */}
              <DashboardCard
                title="المتبقي"
                icon="fas fa-clock"
                className="bg-danger/10 border-danger/30"
              >
                <div className="text-3xl font-bold text-danger">
                  {Math.max(0, (report.summary.subscription_fee || 0) - (report.summary.confirmed_payments || 0)).toLocaleString()} ج.م
                </div>
                <div className="text-sm text-gray-400">
                  {report.summary.not_paying_students_count} طالب لم يدفع
                </div>
              </DashboardCard>
            </div>

            {/* Financial Details */}
            {report.financial_details && (
              <DashboardCard title="تفاصيل مالية" icon="fas fa-calculator">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">إجمالي الإيرادات</div>
                    <div className="text-xl font-bold text-white">
                      {report.financial_details.total_revenue?.toLocaleString()} ج.م
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-primary text-sm mb-1">رسوم المنصة (السعر المدفوع)</div>
                    <div className="text-xl font-bold text-primary">
                      {report.financial_details.subscription_fee?.toLocaleString()} ج.م
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">المبلغ المتبقي</div>
                    <div className="text-xl font-bold text-white">
                      {report.financial_details.remaining_balance?.toLocaleString()} ج.م
                    </div>
                  </div>
                </div>
              </DashboardCard>
            )}

            {/* Subscription Breakdown */}
            {report.subscription_breakdown && report.subscription_breakdown.length > 0 && (
              <DashboardCard title="تفصيل الاشتراكات الشهرية" icon="fas fa-calendar-alt">
                <DataTable
                  columns={subscriptionColumns}
                  data={report.subscription_breakdown}
                  emptyMessage="لا توجد بيانات"
                />
              </DashboardCard>
            )}

            {/* Monthly Breakdown */}
            {report.monthly_breakdown && report.monthly_breakdown.length > 0 && (
              <DashboardCard title="التفصيل الشهري" icon="fas fa-chart-bar">
                <DataTable
                  columns={[
                    { key: 'month_name', label: 'الشهر', sortable: true },
                    { key: 'new_enrollments', label: 'الطلاب الجدد', sortable: true },
                    {
                      key: 'confirmed_payments',
                      label: 'المدفوعات المؤكدة',
                      sortable: true,
                      render: (value: number) => `${value.toLocaleString()} ج.م`,
                    },
                  ]}
                  data={report.monthly_breakdown}
                  emptyMessage="لا توجد بيانات"
                />
              </DashboardCard>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
