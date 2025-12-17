'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { getExams, toggleExamStatus, endExam } from '@/services/authService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';

interface Exam {
  id: number;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  date: string;
  duration: number;
  max_score: number;
  is_active: boolean;
  ended_at?: string | null;
}

export default function ExamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [examToEnd, setExamToEnd] = useState<Exam | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 10;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchExams(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchExams = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getExams(page, itemsPerPage, { search: searchQuery });
      setExams(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الامتحان؟')) {
      // TODO: Implement delete API call
      // TODO: Implement delete API call
    }
  };

  const handleToggleStatus = async (exam: Exam) => {
    try {
      await toggleExamStatus(exam.id.toString());
      toast.success(exam.is_active ? 'تم إلغاء تفعيل الامتحان' : 'تم تفعيل الامتحان');
      fetchExams(currentPage);
    } catch (error) {
      console.error('Error toggling exam status:', error);
      toast.error('حدث خطأ أثناء تغيير حالة الامتحان');
    }
  };

  const handleEndExam = (exam: Exam) => {
    setExamToEnd(exam);
    setIsEndModalOpen(true);
  };

  const confirmEndExam = async () => {
    if (!examToEnd) return;

    setIsProcessing(true);
    try {
      await endExam(examToEnd.id.toString());
      toast.success('تم إنهاء الامتحان بنجاح');
      fetchExams(currentPage);
      setIsEndModalOpen(false);
      setExamToEnd(null);
    } catch (error) {
      console.error('Error ending exam:', error);
      toast.error('حدث خطأ أثناء إنهاء الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalExams = totalItems;
  const upcomingExams = 0;
  const completedExams = 0;
  const avgScore = 0;

  const tableColumns = [
    {
      key: 'title',
      label: 'عنوان الامتحان',
      sortable: true,
    },
    {
      key: 'subject',
      label: 'المادة',
      sortable: true,
    },
    {
      key: 'grade',
      label: 'الصف',
      sortable: true,
      render: (_: any, row: Exam) => row.grade?.name || '-',
    },
    {
      key: 'date',
      label: 'التاريخ',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
    {
      key: 'duration',
      label: 'المدة (دقيقة)',
      sortable: true,
    },
    {
      key: 'max_score',
      label: 'الدرجة الكلية',
      sortable: true,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (_: any, row: Exam) => {
        if (row.ended_at) {
          return (
            <span className="badge badge-danger">
              منتهي
            </span>
          );
        }
        return (
          <span className={`badge badge-${row.is_active ? 'success' : 'warning'}`}>
            {row.is_active ? 'نشط' : 'غير نشط'}
          </span>
        );
      },
    },
  ];

  const tableActions = [
    {
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: Exam) => router.push(`/teacher/exams/${row.id}`),
    },
    {
      label: (row: Exam) => row.is_active ? 'إلغاء التفعيل' : 'تفعيل',
      icon: (row: Exam) => row.is_active ? 'fas fa-toggle-on' : 'fas fa-toggle-off',
      onClick: (row: Exam) => handleToggleStatus(row),
      variant: (row: Exam) => row.is_active ? 'warning' : 'success',
    },
    {
      label: 'إنهاء الامتحان',
      icon: 'fas fa-stop-circle',
      onClick: (row: Exam) => handleEndExam(row),
      variant: 'danger' as const,
      show: (row: Exam) => row.is_active,
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: Exam) => router.push(`/teacher/exams/${row.id}/edit`),
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as const,
      onClick: (row: Exam) => handleDelete(row.id),
    },
  ];

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الامتحانات"
          value={totalExams}
          icon="fas fa-file-alt"
          color="primary"
        />
        <StatCard
          title="امتحانات قادمة"
          value={upcomingExams}
          icon="fas fa-calendar-alt"
          color="warning"
        />
        <StatCard
          title="امتحانات منتهية"
          value={completedExams}
          icon="fas fa-check-circle"
          color="success"
        />
        <StatCard
          title="متوسط الدرجات"
          value={avgScore}
          suffix="%"
          icon="fas fa-chart-line"
          color="danger"
        />
      </div>

      {/* Exams Table */}
      <DashboardCard
        title="جميع الامتحانات"
        icon="fas fa-list"
        action={
          <button onClick={() => router.push('/teacher/exams/add')} className="btn btn-primary">
            <i className="fas fa-plus"></i>
            <span>امتحان جديد</span>
          </button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={exams}
          actions={tableActions}
          isLoading={loading}
          searchable={true}
          onSearch={setSearchQuery}
          pagination={true}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(page) => fetchExams(page)}
        />

        <ConfirmationModal
          isOpen={isEndModalOpen}
          title="إنهاء الامتحان"
          message="هل أنت متأكد من إنهاء هذا الامتحان؟ سيتم إغلاقه على جميع الطلاب واحتساب النتائج فوراً. لا يمكن التراجع عن هذا الإجراء."
          confirmText="نعم، إنهاء الامتحان"
          cancelText="إلغاء"
          onConfirm={confirmEndExam}
          onCancel={() => {
            setIsEndModalOpen(false);
            setExamToEnd(null);
          }}
          isProcessing={isProcessing}
          variant="danger"
        />
      </DashboardCard>
    </DashboardLayout>
  );
}
