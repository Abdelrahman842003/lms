'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';

import { MonthDropdown } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import * as academyService from '@/services/academyService';
import toast from 'react-hot-toast';



const translateSummaryKey = (key: string): string => {
  const translations: Record<string, string> = {
    'total_teachers': 'إجمالي المدرسين',
    'total_students': 'إجمالي الطلاب',
    'linked_students_count': 'الطلاب المرتبطين',
    'total_lectures_count': 'إجمالي المحاضرات',
    'total_exams_count': 'إجمالي الامتحانات',
    'total_secretaries_count': 'إجمالي السكيرتيرات',
    'total_payment_transactions': 'عمليات الدفع',
    'total_enrollments': 'إجمالي الارتباطات',
    'total_attendance_logs': 'إجمالي سجلات الحضور',
    'total_days': 'إجمالي الأيام',
    'total_present': 'إجمالي الحضور',
    'total_absent': 'إجمالي الغياب',
    'total_checked_in': 'حاضر حالياً',
    'total_duration_minutes': 'إجمالي المدة (دقيقة)',
    'average_duration_minutes': 'متوسط المدة (دقيقة)',
    'total_students_records': 'عدد الطلاب',
    'average_attendance': 'متوسط الحضور (%)',
    'average_score': 'متوسط الدرجات (%)',
    'total_revenue': 'إجمالي الإيرادات',
    'platform_fees': 'رسوم المنصة',
    'net_revenue': 'صافي الإيرادات',
    'net_payments_to_academy': 'المدفوعات الصافيه للاكاديميه',
    'payments_due_to_platform': 'المدفوعات المستحقه للمنصه',
    'payment_status': 'حاله الدفع',
  };
  return translations[key] || key.replace(/_/g, ' ');
};

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportType, setReportType] = useState<'attendance' | 'teachers' | 'monthly'>('attendance');

  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  
  // Payment Modal State

  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);



  const handleGenerateReport = async () => {

    setIsLoading(true);
    setReport(null);

    try {
      let response;


      switch (reportType) {
        case 'attendance':
          let dateFrom, dateTo;
          if (month === 0) {
            dateFrom = `${year}-01-01`;
            dateTo = `${year}-12-31`;
          } else {
            const lastDay = new Date(year, month, 0).getDate();
            dateFrom = `${year}-${month.toString().padStart(2, '0')}-01`;
            dateTo = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
          }
          
          response = await academyService.getAttendanceReport({
            date_from: dateFrom,
            date_to: dateTo
          });
          break;

        case 'monthly':
          response = await academyService.getMonthlyReport(month, year);
          break;
      }

      setReport(response.data);
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('فشل إنشاء التقرير');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) {
      toast.error('يرجى إنشاء التقرير أولاً');
      return;
    }

    setIsDownloading(true);

    try {
      let params: any = {
        report_type: reportType,
        month,
        year,
      };

      if (reportType === 'attendance') {
        let dateFrom, dateTo;
        if (month === 0) {
          dateFrom = `${year}-01-01`;
          dateTo = `${year}-12-31`;
        } else {
          const lastDay = new Date(year, month, 0).getDate();
          dateFrom = `${year}-${month.toString().padStart(2, '0')}-01`;
          dateTo = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        }
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }

      await academyService.exportReportToPDF(params);
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('فشل تحميل التقرير');
    } finally {
      setIsDownloading(false);
    }
  };




  if (authLoading || !user || user.userType !== 'academy') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }



  return (
    <DashboardLayout role="academy" user={user}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fas fa-chart-bar text-primary"></i>
          التقارير
        </h1>

        {/* Report Type Selection */}
        <DashboardCard title="نوع التقرير" icon="fas fa-file-alt" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setReportType('attendance'); setReport(null); }}
              className={`p-6 rounded-xl border-2 transition-all ${
                reportType === 'attendance'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/30'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <i className={`fas fa-calendar-check text-4xl mb-3 ${
                reportType === 'attendance' ? 'text-primary' : 'text-gray-400'
              }`}></i>
              <h3 className="text-white font-semibold text-lg">تقرير الحضور</h3>
              <p className="text-gray-400 text-sm mt-2">إحصائيات حضور المدرسين</p>
            </button>

            <button
              onClick={() => { setReportType('monthly'); setReport(null); }}
              className={`p-6 rounded-xl border-2 transition-all ${
                reportType === 'monthly'
                  ? 'border-success bg-success/10 shadow-lg shadow-success/30'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <i className={`fas fa-chart-line text-4xl mb-3 ${
                reportType === 'monthly' ? 'text-success' : 'text-gray-400'
              }`}></i>
              <h3 className="text-white font-semibold text-lg">التقرير الشهري</h3>
              <p className="text-gray-400 text-sm mt-2">ملخص شهري شامل</p>
            </button>
          </div>
        </DashboardCard>

        {/* Filters Card */}
        <DashboardCard title="خيارات التقرير" icon="fas fa-filter" className="mb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MonthDropdown
                value={month}
                onChange={setMonth}
                label="الشهر"
              />
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  <i className="fas fa-calendar ml-2 text-primary"></i>
                  السنة
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full p-3 bg-dark-lighter border-2 border-gray-700 rounded-lg text-white hover:border-primary transition-all"
                  min="2020"
                  max="2030"
                />
              </div>
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
          console.log('Report Data:', report),
          <DashboardCard title="نتائج التقرير" icon="fas fa-chart-bar">
            <div className="space-y-6">
              {/* Summary Stats */}
              {report.summary && (
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 md:gap-4">
                  {Object.entries(report.summary)
                    .filter(([key]) => !['total_days', 'average_duration_minutes', 'total_duration_minutes', 'total_checked_in', 'total_attendance_logs', 'total_present', 'total_absent'].includes(key))
                    .map(([key, value]: any) => (
                    <div key={key} className="p-3 md:p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-gray-400 text-xs md:text-sm mb-1">
                        {translateSummaryKey(key)}
                      </h4>
                      <p className="text-white text-lg md:text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial Summary Detailed */}
              {report.financial_details && (
                <div className="mt-6">
                  <h3 className="text-white text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                    <i className="fas fa-coins text-primary"></i>
                    الملخص المالي
                  </h3>
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    {/* Mobile View */}
                    <div className="block md:hidden divide-y divide-white/5">
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">المدفوعات الصافيه للاكاديميه</span>
                          <span className="font-bold text-primary">{report.financial_details.net_payments_to_academy} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">المدفوعات المستحقه للمنصه</span>
                          <span className="font-bold text-warning">{report.financial_details.payments_due_to_platform} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">الباقي من التسديد</span>
                          <span className="font-bold text-info">{report.financial_details.remaining_balance} ج.م</span>
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
                    <table className="hidden md:table w-full text-right">
                      <thead className="bg-white/5 text-gray-400">
                        <tr>
                          <th className="p-4 font-medium">البند</th>
                          <th className="p-4 font-medium">القيمة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white">
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4">المدفوعات الصافيه للاكاديميه</td>
                          <td className="p-4 font-bold text-primary">{report.financial_details.net_payments_to_academy} ج.م</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4">المدفوعات المستحقه للمنصه</td>
                          <td className="p-4 font-bold text-warning">{report.financial_details.payments_due_to_platform} ج.م</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4">الباقي من التسديد</td>
                          <td className="p-4 font-bold text-info">{report.financial_details.remaining_balance} ج.م</td>
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
                </div>
              )}

              {/* Teachers Details Table */}
              {report.teachers_details && Array.isArray(report.teachers_details) && (
                <div className="mt-6">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-users text-secondary"></i>
                    تفاصيل المدرسين
                  </h3>
                  <DataTable
                    columns={[
                      { key: 'name', label: 'الاسم', sortable: true },
                      { 
                        key: 'status', 
                        label: 'الحالة',
                        render: (value: string) => (
                          <span className={`badge ${value === 'نشط' ? 'badge-success' : 'badge-danger'}`}>
                            {value}
                          </span>
                        )
                      },
                      { key: 'total_students', label: 'إجمالي الطلاب', sortable: true },
                      { key: 'active_subscriptions', label: 'النشطين', sortable: true },
                      { key: 'secretaries_count', label: 'السكرتارية' },
                      { 
                        key: 'total_revenue', 
                        label: 'الإيرادات', 
                        render: (value: number) => `${value} ج.م`
                      },
                    ]}
                    data={report.teachers_details}
                    isLoading={false}
                    searchable={false}
                    pagination={true}
                    itemsPerPage={5}
                  />
                </div>
              )}

              {/* Monthly Breakdown Table */}
              {report.monthly_breakdown && Array.isArray(report.monthly_breakdown) && report.monthly_breakdown.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-success"></i>
                    التفصيل الشهري
                  </h3>
                  <DataTable
                    columns={[
                      { key: 'month_name', label: 'الشهر' },
                      { key: 'new_subscriptions_count', label: 'اشتراكات جديدة' },
                      { 
                        key: 'confirmed_payments_total', 
                        label: 'المدفوعات المؤكدة',
                        render: (value: number) => `${value} ج.م`
                      },
                    ]}
                    data={report.monthly_breakdown}
                    isLoading={false}
                    searchable={false}
                    pagination={true}
                    itemsPerPage={12}
                  />
                </div>
              )}

              {/* Attendance Logs Table (Only show if NOT in monthly/yearly breakdown mode OR explicitly requested) */}
              {reportType === 'attendance' && report.logs && Array.isArray(report.logs) && (
                <div className="mt-6">
                  <h3 className="text-white text-lg font-semibold mb-4">سجلات الحضور</h3>
                  <DataTable
                    columns={[
                      {
                        key: 'teacher.name',
                        label: 'المدرس',
                        sortable: true,
                        render: (_: any, row: any) => row.teacher?.name || '-',
                      },
                      {
                        key: 'date',
                        label: 'التاريخ',
                        sortable: true,
                        render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
                      },
                      {
                        key: 'checked_in_at',
                        label: 'الحضور',
                        render: (value: string) => value ? new Date(value).toLocaleTimeString('ar-EG') : '-',
                      },
                      {
                        key: 'checked_out_at',
                        label: 'الانصراف',
                        render: (value: string) => value ? new Date(value).toLocaleTimeString('ar-EG') : '-',
                      },
                    ]}
                    data={report.logs}
                    isLoading={false}
                    searchable={true}
                    pagination={true}
                    itemsPerPage={10}
                  />
                </div>
              )}




            </div>
          </DashboardCard>
        )}
      </div>

      {/* Payment Modal */}
    </DashboardLayout>
  );
}
