'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { CreativeDatePicker } from '@/components/ui/CreativeDatePicker';
import { MonthDropdown } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import * as academyService from '@/services/academyService';
import toast from 'react-hot-toast';

type PeriodPreset = 'today' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';

const translateSummaryKey = (key: string): string => {
  const translations: Record<string, string> = {
    'total_teachers': 'إجمالي المدرسين',
    'total_students': 'إجمالي الطلاب',
    'total_attendance_logs': 'إجمالي سجلات الحضور',
    'total_days': 'إجمالي الأيام',
    'total_present': 'إجمالي الحضور',
    'total_absent': 'إجمالي الغياب',
    'total_checked_in': 'حاضر حالياً',
    'total_duration_minutes': 'إجمالي المدة (دقيقة)',
    'average_duration_minutes': 'متوسط المدة (دقيقة)',
  };
  return translations[key] || key.replace(/_/g, ' ');
};

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportType, setReportType] = useState<'attendance' | 'teachers' | 'monthly'>('attendance');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);

  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const getDateRange = () => {
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
          date_from: customStartDate,
          date_to: customEndDate,
        };
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return {
      date_from: formatDate(startDate),
      date_to: formatDate(endDate),
    };
  };

  const handleGenerateReport = async () => {
    if (periodPreset === 'custom' && (!customStartDate || !customEndDate)) {
      toast.error('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      let response;
      const params = getDateRange();

      switch (reportType) {
        case 'attendance':
          response = await academyService.getAttendanceReport(params);
          break;
        case 'teachers':
          response = await academyService.getTeachersReport();
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
      const params: any = {
        report_type: reportType,
      };

      if (reportType === 'attendance') {
        const dateRange = getDateRange();
        params.date_from = dateRange.date_from;
        params.date_to = dateRange.date_to;
      } else if (reportType === 'monthly') {
        params.month = month;
        params.year = year;
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

  const periodPresets = [
    { value: 'today', label: 'اليوم' },
    { value: 'last_month', label: 'الشهر الحالي' },
    { value: 'last_3_months', label: 'آخر 3 شهور' },
    { value: 'last_6_months', label: 'آخر 6 شهور' },
    { value: 'last_year', label: 'آخر سنة' },
    { value: 'custom', label: 'مخصص' },
  ];

  return (
    <DashboardLayout role="academy" user={user}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fas fa-chart-bar text-primary"></i>
          التقارير
        </h1>

        {/* Report Type Selection */}
        <DashboardCard title="نوع التقرير" icon="fas fa-file-alt" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={() => { setReportType('teachers'); setReport(null); }}
              className={`p-6 rounded-xl border-2 transition-all ${
                reportType === 'teachers'
                  ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/30'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <i className={`fas fa-chalkboard-teacher text-4xl mb-3 ${
                reportType === 'teachers' ? 'text-secondary' : 'text-gray-400'
              }`}></i>
              <h3 className="text-white font-semibold text-lg">تقرير المدرسين</h3>
              <p className="text-gray-400 text-sm mt-2">إحصائيات شاملة للمدرسين</p>
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
            {/* Period Selection for Attendance */}
            {reportType === 'attendance' && (
              <>
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
                      <CreativeDatePicker
                        label="من تاريخ"
                        value={customStartDate}
                        onChange={setCustomStartDate}
                      />
                      <CreativeDatePicker
                        label="إلى تاريخ"
                        value={customEndDate}
                        onChange={setCustomEndDate}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Month/Year Selection for Monthly Report */}
            {reportType === 'monthly' && (
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
            )}

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
          <DashboardCard title="نتائج التقرير" icon="fas fa-chart-bar">
            <div className="space-y-6">
              {/* Summary Stats */}
              {report.summary && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  {Object.entries(report.summary).map(([key, value]: any) => (
                    <div key={key} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-gray-400 text-sm mb-1">
                        {translateSummaryKey(key)}
                      </h4>
                      <p className="text-white text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Attendance Logs Table */}
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
                      {
                        key: 'duration_formatted',
                        label: 'المدة',
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

              {/* Teachers Report Table */}
              {reportType === 'teachers' && report.teachers && Array.isArray(report.teachers) && (
                <div className="mt-6">
                  <h3 className="text-white text-lg font-semibold mb-4">قائمة المدرسين</h3>
                  <DataTable
                    columns={[
                      {
                        key: 'name',
                        label: 'اسم المدرس',
                        sortable: true,
                      },
                      {
                        key: 'phone',
                        label: 'رقم الهاتف',
                      },
                      {
                        key: 'students_count',
                        label: 'عدد الطلاب',
                        sortable: true,
                      },
                      {
                        key: 'status',
                        label: 'الحالة',
                        render: (value: string) => (
                          <span className={`badge ${value === 'نشط' ? 'badge-success' : 'badge-danger'}`}>
                            {value}
                          </span>
                        ),
                      },
                    ]}
                    data={report.teachers}
                    isLoading={false}
                    searchable={true}
                    pagination={true}
                    itemsPerPage={10}
                  />
                </div>
              )}

              {/* Monthly Report - Financial Details */}
              {reportType === 'monthly' && report.financial_details && (
                <div className="mt-6">
                  <h3 className="text-white text-lg font-semibold mb-4">التفاصيل المالية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                      <h4 className="text-success text-sm mb-1">إجمالي الإيرادات</h4>
                      <p className="text-white text-2xl font-bold">{report.financial_details.total_revenue || 0} جنيه</p>
                    </div>
                    <div className="p-4 bg-danger/10 rounded-xl border border-danger/20">
                      <h4 className="text-danger text-sm mb-1">رسوم المنصة</h4>
                      <p className="text-white text-2xl font-bold">{report.financial_details.platform_fees || 0} جنيه</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <h4 className="text-primary text-sm mb-1">صافي الإيرادات</h4>
                      <p className="text-white text-2xl font-bold">{report.financial_details.net_revenue || 0} جنيه</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
}
