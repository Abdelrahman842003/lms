'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { toast } from 'react-hot-toast';
import {
  getReportTeachers,
  getReportAcademies,
  getTeacherReport,
  getAcademyReport,
  getAdminReport,
  downloadTeacherReportPdf,
  downloadAdminReportPdf,
  ReportParams,
} from '@/services/authService';

type ReportType = 'admin' | 'teacher' | 'academy';
type PeriodPreset = 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';

interface Teacher {
  id: string;
  name: string;
  phone: string;
  status: string;
  students_count: number;
  secretaries_count: number;
  joined: string;
}

interface Academy {
  id: string;
  name: string;
  phone: string;
  status: string;
  teachers_count: number;
  students_count: number;
  joined: string;
}

function ReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const searchParams = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('admin');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'teacher' || type === 'admin' || type === 'academy') {
      setReportType(type as ReportType);
    }
  }, [searchParams]);

  // Fetch teachers list on mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await getReportTeachers();
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setTeachers(data);
        } else if (data && typeof data === 'object') {
          setTeachers((data as any).teachers || []);
        } else {
          setTeachers([]);
        }
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
        toast.error('فشل تحميل قائمة المدرسين');
      }
    };
    fetchTeachers();
  }, []);

  // Fetch academies list on mount
  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        const data = await getReportAcademies();
        if (Array.isArray(data)) {
          setAcademies(data);
        } else if (data && typeof data === 'object') {
          setAcademies((data as any).academies || []);
        } else {
          setAcademies([]);
        }
      } catch (error) {
        console.error('Failed to fetch academies:', error);
        toast.error('فشل تحميل قائمة الأكاديميات');
      }
    };
    fetchAcademies();
  }, []);

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
    if (reportType === 'teacher' && !selectedTeacherId) {
      toast.error('يرجى اختيار مدرس');
      return;
    }

    if (reportType === 'academy' && !selectedAcademyId) {
      toast.error('يرجى اختيار أكاديمية');
      return;
    }

    if (periodPreset === 'custom' && (!customStartDate || !customEndDate)) {
      toast.error('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const params = getDateRange();
      
      if (reportType === 'admin') {
        const data = await getAdminReport(params);
        setReport(data);
      } else if (reportType === 'academy') {
        const data = await getAcademyReport(selectedAcademyId, params);
        setReport(data);
      } else {
        const data = await getTeacherReport(selectedTeacherId, params);
        setReport(data);
      }
      
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
      
      if (reportType === 'admin') {
        await downloadAdminReportPdf(params);
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

  const periodPresets = [
    { value: 'last_month', label: 'الشهر الحالي' },
    { value: 'last_3_months', label: 'آخر 3 شهور' },
    { value: 'last_6_months', label: 'آخر 6 شهور' },
    { value: 'last_year', label: 'آخر سنة' },
    { value: 'custom', label: 'مخصص' },
  ];

  // Monthly breakdown table columns
  const monthlyColumns = [
    { key: 'month_name', label: 'الشهر', sortable: true },
    {
      key: 'confirmed_payments',
      label: 'المدفوعات المؤكدة',
      sortable: true,
      render: (value: number) => (
        <span className="text-secondary font-semibold">
          {value.toLocaleString()} ج.م
        </span>
      ),
    },
  ];

  // Teachers breakdown table columns
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
    { key: 'secretaries', label: 'السكرتارية', sortable: true },
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
                <button
                  type="button"
                  onClick={() => {
                    setReportType('admin');
                    setReport(null);
                  }}
                  className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                    reportType === 'admin'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <i className="fas fa-chart-pie"></i>
                  التقرير العام
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportType('teacher');
                    setReport(null);
                  }}
                  className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                    reportType === 'teacher'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <i className="fas fa-chalkboard-teacher"></i>
                  تقرير مدرس
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportType('academy');
                    setReport(null);
                  }}
                  className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                    reportType === 'academy'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <i className="fas fa-building"></i>
                  تقرير أكاديمية
                </button>
              </div>
            </div>

            {/* Teacher Selection (if teacher report) */}
            {reportType === 'teacher' && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">اختر المدرس</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    setReport(null);
                  }}
                  className="w-full md:w-1/2 p-3 bg-[#1a1f37] border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
                  disabled={!teachers || teachers.length === 0}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-[#1a1f37] text-white">-- اختر مدرس --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id} className="bg-[#1a1f37] text-white">
                      {teacher.name} ({teacher.students_count} طالب)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Academy Selection (if academy report) */}
            {reportType === 'academy' && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">اختر الأكاديمية</label>
                <select
                  value={selectedAcademyId}
                  onChange={(e) => {
                    setSelectedAcademyId(e.target.value);
                    setReport(null);
                  }}
                  className="w-full md:w-1/2 p-3 bg-[#1a1f37] border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
                  disabled={!academies || academies.length === 0}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-[#1a1f37] text-white">-- اختر أكاديمية --</option>
                  {academies.map((academy) => (
                    <option key={academy.id} value={academy.id} className="bg-[#1a1f37] text-white">
                      {academy.name} ({academy.teachers_count} مدرس)
                    </option>
                  ))}
                </select>
              </div>
            )}

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {reportType === 'admin' && (
                <>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.total_academies}
                    </div>
                    <div className="text-gray-400 text-sm">عدد الأكاديميات</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.independent_teachers_count}
                    </div>
                    <div className="text-gray-400 text-sm">مدرسين مستقلين</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.total_teachers}
                    </div>
                    <div className="text-gray-400 text-sm">إجمالي المدرسين</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.total_students}
                    </div>
                    <div className="text-gray-400 text-sm">إجمالي الطلاب</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.total_enrollments}
                    </div>
                    <div className="text-gray-400 text-sm">إجمالي الارتباطات</div>
                  </div>
                </>
              )}

              {reportType === 'academy' && (
                <>
                  {/* Total Teachers */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.active_teachers}
                    </div>
                    <div className="text-gray-400 text-sm">إجمالي المدرسين</div>
                  </div>

                  {/* Total Students */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.total_academy_students}
                    </div>
                    <div className="text-gray-400 text-sm">إجمالي الطلاب</div>
                  </div>

                  {/* Total Enrollments */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.total_enrollments}
                    </div>
                    <div className="text-gray-400 text-sm">إجمالي الارتباطات</div>
                  </div>

                  {/* Expected Revenue */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">
                      {report.summary.expected_revenue?.toLocaleString()} ج.م
                    </div>
                    <div className="text-gray-400 text-sm">الإيرادات المتوقعة</div>
                  </div>
                </>
              )}

              {reportType === 'teacher' && (
                <>
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
                    <div className="text-gray-400 text-sm">اشتراكات جديدة</div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-xl border border-secondary/30">
                    <div className="text-3xl font-bold text-secondary mb-1">
                      {report.summary.calculated_revenue?.toLocaleString()} ج.م
                    </div>
                    <div className="text-gray-400 text-sm">الإيرادات المحسوبة</div>
                  </div>
                </>
              )}
            </div>

            {/* Teacher Info (for teacher report) */}
            {reportType === 'teacher' && report.teacher && (
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

            {/* Academy Info (for academy report) */}
            {reportType === 'academy' && report.academy && (
              <DashboardCard title="معلومات الأكاديمية" icon="fas fa-building" className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">الاسم</div>
                    <div className="text-white font-medium">{report.academy.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">الهاتف</div>
                    <div className="text-white font-medium">{report.academy.phone}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">تاريخ الانضمام</div>
                    <div className="text-white font-medium">{report.academy.joined}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">الحالة</div>
                    <span className={`badge ${report.academy.status === 'نشط' ? 'badge-success' : 'badge-danger'}`}>
                      {report.academy.status}
                    </span>
                  </div>
                </div>
              </DashboardCard>
            )}

            {/* Financial Summary */}
            <DashboardCard title="الملخص المالي" icon="fas fa-coins" className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">البند</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">القيمة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportType === 'admin' ? (
                      <>
                        {/* Independent */}
                        <tr className="border-b border-white/5 bg-white/5">
                          <td className="py-3 px-4 text-white font-bold" colSpan={2}>المدرسين المستقلين</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4 text-gray-300 pr-8">عمولة المنصة</td>
                          <td className="py-3 px-4 text-success">
                            {report.summary.independent_commission?.toLocaleString()} ج.م
                          </td>
                        </tr>

                        {/* Academies */}
                        <tr className="border-b border-white/5 bg-white/5">
                          <td className="py-3 px-4 text-white font-bold" colSpan={2}>الأكاديميات</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4 text-gray-300 pr-8">إيرادات الأكاديميات (للمنصة)</td>
                          <td className="py-3 px-4 text-success">
                            {report.summary.academy_revenue?.toLocaleString()} ج.م
                          </td>
                        </tr>

                        {/* Platform Totals */}
                        <tr className="border-b border-white/5 bg-primary/10">
                          <td className="py-3 px-4 text-white font-bold" colSpan={2}>إجماليات المنصة</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-gray-300 pr-8">صافي ربح المنصة</td>
                          <td className="py-3 px-4 text-secondary font-bold text-lg">
                            {report.summary.total_profit?.toLocaleString()} ج.م
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4 text-white">المدفوعات المؤكدة</td>
                          <td className="py-3 px-4 text-secondary font-semibold">
                            {report.summary.confirmed_payments?.toLocaleString()} ج.م
                          </td>
                        </tr>
                        {reportType === 'teacher' && (
                          <tr className="border-b border-white/5">
                            <td className="py-3 px-4 text-white">المدفوعات المعلقة</td>
                            <td className="py-3 px-4 text-warning font-semibold">
                              {report.summary.pending_payments?.toLocaleString()} ج.م
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-3 px-4 text-white">
                            الإيرادات المحسوبة
                            <span className="text-gray-500 text-sm mr-2">
                              ({reportType === 'admin' ? report.summary.active_enrollments : report.summary.active_students} × {report.summary.price_per_student} ج.م)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-secondary font-bold text-lg">
                            {(reportType === 'admin' ? report.summary.total_revenue : report.summary.calculated_revenue)?.toLocaleString()} ج.م
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            {/* Teachers Breakdown (REMOVED) */}

            {/* Monthly Breakdown */}
            {report.monthly_breakdown?.length > 0 && (
              <DashboardCard title="التفصيل الشهري" icon="fas fa-calendar-alt" noPadding>
                <DataTable
                  columns={monthlyColumns}
                  data={report.monthly_breakdown}
                  searchable={false}
                  pagination={false}
                />
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

export default withAdminAuth(ReportsPage);
