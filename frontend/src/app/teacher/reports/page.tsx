'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'react-hot-toast';
import {
  getMyTeacherReport,
  downloadMyTeacherReportPdf,
  ReportParams,
} from '@/services/authService';

type PeriodPreset = 'today' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';

export default function TeacherReportsPage() {

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [report, setReport] = useState<any>(null);

  // Calculate date range based on preset
  const getDateRange = (): ReportParams => {
    const today = new Date();
    let startDate: Date;
    const endDate = today;

    // Helper function to format date as YYYY-MM-DD in local timezone
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
        // Current month only (from 1st of current month to today)
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_3_months':
        // Last 3 calendar months (from 1st of month, 2 months ago, to today)
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        break;
      case 'last_6_months':
        // Last 6 calendar months
        startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        break;
      case 'last_year':
        // Last 12 calendar months
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

  return (
    <DashboardLayout role={user?.userType as 'teacher' | 'secretary' || 'teacher'} user={user || undefined}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fas fa-chart-bar text-primary"></i>
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
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setPeriodPreset(preset.value as PeriodPreset);
                      setReport(null);
                    }}
                    className={`px-4 py-2 rounded-lg transition-all text-sm ${
                      periodPreset === preset.value
                        ? 'bg-secondary text-white shadow-lg shadow-secondary/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {periodPreset === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <label className="block text-gray-400 mb-2 text-sm">من تاريخ</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2 text-sm">إلى تاريخ</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="btn btn-primary px-6 py-3 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <i className="fas fa-chart-line"></i>
                    إنشاء التقرير
                  </>
                )}
              </button>

              {report && (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="btn btn-secondary px-6 py-3 flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-pdf"></i>
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
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">
                  {report.summary.total_students}
                </div>
                <div className="text-gray-400 text-sm">إجمالي الطلاب</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">
                  {report.summary.active_students}
                </div>
                <div className="text-gray-400 text-sm">الطلاب النشطين</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">
                  {report.summary.new_enrollments}
                </div>
                <div className="text-gray-400 text-sm">عدد الاشتراكات</div>
              </div>
              <div className="p-4 bg-secondary/20 rounded-xl border border-secondary/30">
                <div className="text-3xl font-bold text-secondary mb-1">
                  {report.summary.calculated_revenue?.toLocaleString()} ج.م
                </div>
                <div className="text-gray-400 text-sm">مستحقات المنصة</div>
                <div className="text-gray-500 text-xs mt-1">
                  {report.summary.new_enrollments} × {
                    report.summary.teacher_student_price || 
                    (report.summary.new_enrollments > 0 
                      ? Math.round(report.summary.calculated_revenue / report.summary.new_enrollments) 
                      : 0)
                  } ج.م
                </div>
              </div>
            </div>

            {/* Teacher Info */}
            {report.teacher && (
              <DashboardCard title="معلومات المدرس" icon="fas fa-user" className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">الاسم</div>
                    <div className="text-white font-medium">{report.teacher.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">الهاتف</div>
                    <div className="text-white font-medium">{report.teacher.phone}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">تاريخ الانضمام</div>
                    <div className="text-white font-medium">{report.teacher.joined}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">الحالة</div>
                    <span className={`badge ${report.teacher.status === 'نشط' ? 'badge-success' : 'badge-danger'}`}>
                      {report.teacher.status}
                    </span>
                  </div>
                </div>
              </DashboardCard>
            )}

            {/* Teacher Profits */}
            <DashboardCard title="ارباح المدرس" icon="fas fa-hand-holding-dollar" className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-success/10 rounded-xl border border-success/30">
                  <div className="text-2xl font-bold text-success mb-1">
                    {report.summary.confirmed_payments?.toLocaleString() || 0} ج.م
                  </div>
                  <div className="text-gray-400 text-sm">صافي الارباح</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {report.summary.paying_students_count || 0}
                  </div>
                  <div className="text-gray-400 text-sm">طلاب دفعوا</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {report.summary.not_paying_students_count || 0}
                  </div>
                  <div className="text-gray-400 text-sm">طلاب لم يدفعوا</div>
                </div>
              </div>
            </DashboardCard>

            {/* Financial Details */}
            {report.financial_details && (
              <DashboardCard title="الملخص المالي" icon="fas fa-coins" className="mb-6">
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400">صافي الأرباح للمدرس</span>
                      <span className="text-primary font-bold text-lg">
                        {report.financial_details.net_payments_to_teacher?.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
                      <span className="text-gray-400">المدفوعات المستحقة للمنصة</span>
                      <span className="text-warning font-bold text-lg">
                        {report.financial_details.payments_due_to_platform?.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
                      <span className="text-gray-400">الباقي من التسديد</span>
                      <span className="text-info font-bold text-lg">
                        {report.financial_details.remaining_balance?.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">حاله الدفع</span>
                        <span className={`badge ${report.financial_details.payment_status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                          {report.financial_details.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-white/5 text-gray-400">
                      <tr>
                        <th className="p-4 font-medium">البند</th>
                        <th className="p-4 font-medium">القيمة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="p-4">صافي الأرباح للمدرس</td>
                        <td className="p-4 font-bold text-primary">
                          {report.financial_details.net_payments_to_teacher?.toLocaleString()} ج.م
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="p-4">المدفوعات المستحقة للمنصة</td>
                        <td className="p-4 font-bold text-warning">
                          {report.financial_details.payments_due_to_platform?.toLocaleString()} ج.م
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="p-4">الباقي من التسديد</td>
                        <td className="p-4 font-bold text-info">
                          {report.financial_details.remaining_balance?.toLocaleString()} ج.م
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="p-4">حاله الدفع</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <span className={`badge ${report.financial_details.payment_status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                              {report.financial_details.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            )}

            {/* Subscription Summary */}
            {/* Subscription Summary removed as per request */}
            {/* <DashboardCard title="ملخص الاشتراكات" icon="fas fa-coins" className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {report.summary.total_due?.toLocaleString() || 0} ج.م
                  </div>
                  <div className="text-gray-400 text-sm">إجمالي المستحقات</div>
                </div>
                <div className="p-4 bg-success/10 rounded-xl border border-success/30">
                  <div className="text-2xl font-bold text-success mb-1">
                    {report.summary.total_paid?.toLocaleString() || 0} ج.م
                  </div>
                  <div className="text-gray-400 text-sm">إجمالي المدفوع</div>
                </div>
                <div className="p-4 bg-danger/10 rounded-xl border border-danger/30">
                  <div className="text-2xl font-bold text-danger mb-1">
                    {report.summary.total_remaining?.toLocaleString() || 0} ج.م
                  </div>
                  <div className="text-gray-400 text-sm">إجمالي المتبقي</div>
                </div>
              </div>
            </DashboardCard> */}

            {/* Monthly Subscription Breakdown */}
            {report.subscription_breakdown?.length > 0 && (
              <DashboardCard title="تفاصيل الاشتراكات الشهرية للمنصه" icon="fas fa-calendar-alt" className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">الشهر</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">عدد الاشتراكات</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">المستحق</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">المدفوع</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">المتبقي</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.subscription_breakdown.map((month: any, index: number) => (
                        <tr key={month.month} className={index < report.subscription_breakdown.length - 1 ? 'border-b border-white/5' : ''}>
                          <td className="py-3 px-4 text-white font-medium">{month.month_name}</td>
                          <td className="py-3 px-4 text-white">{month.student_count}</td>
                          <td className="py-3 px-4 text-primary font-semibold">
                            {month.amount_due?.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 text-success font-semibold">
                            {month.amount_paid?.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 text-danger font-semibold">
                            {month.amount_remaining?.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${
                              month.status === 'paid' ? 'badge-success' : 
                              month.status === 'partial' ? 'badge-warning' : 
                              'badge-danger'
                            }`}>
                              {month.status_label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            )}

            {/* Student Account Breakdown */}
            {report.student_account_breakdown?.length > 0 && (
              <DashboardCard title="تفاصيل حساب الطلاب" icon="fas fa-file-invoice-dollar" className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">الشهر</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">عدد الطلاب</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">المستحق</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">المدفوع</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">المتبقي</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.student_account_breakdown.map((month: any, index: number) => (
                        <tr key={month.month} className={index < report.student_account_breakdown.length - 1 ? 'border-b border-white/5' : ''}>
                          <td className="py-3 px-4 text-white font-medium">{month.month_name}</td>
                          <td className="py-3 px-4 text-white">{month.student_count}</td>
                          <td className="py-3 px-4 text-primary font-semibold">
                            {month.amount_due?.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 text-success font-semibold">
                            {month.amount_paid?.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 text-danger font-semibold">
                            {month.amount_remaining?.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${
                              month.status === 'paid' ? 'badge-success' : 
                              month.status === 'partial' ? 'badge-warning' : 
                              'badge-danger'
                            }`}>
                              {month.status_label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            )}


            {/* Report Footer */}
            <div className="text-center text-gray-500 text-sm mt-6">
              <p>تم إنشاء التقرير في: {report.generated_at}</p>
              <p>الفترة: {report.period.start} إلى {report.period.end}</p>
            </div>
          </>
        )}
      </div>

    </DashboardLayout>
  );
}
