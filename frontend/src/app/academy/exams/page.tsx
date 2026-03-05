'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExamCard } from '@/components/dashboard/ExamCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  getAcademyExams,
  toggleAcademyExamStatus,
  endAcademyExam,
  copyAcademyExam,
  deleteAcademyExam,
  getTeachers
} from '@/services/academyService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Filter } from '@/components/Filter';
import { toast } from 'react-hot-toast';

import { Button, Icon, Input, Textarea, Select, LoadingSpinner, Badge, FormModal } from '@/components/ui';
interface Exam {
  id: number | string;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  group?: { id: string; name: string };
  teacher?: { id: string; name: string };
  date: string;
  duration: number;
  max_score: number;
  is_active: boolean;
  activated_at?: string | null;
  ended_at?: string | null;
  attended_students?: Array<{
    student_id: string;
    student_name: string;
    score: number;
    percentage: number;
  }>;
}

interface Teacher {
  id: string;
  name: string;
}

export default function AcademyExamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Menu State
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  
  // Modal State
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [examToEnd, setExamToEnd] = useState<Exam | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Copy Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [examToCopy, setExamToCopy] = useState<Exam | null>(null);
  const [newExamTitle, setNewExamTitle] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const itemsPerPage = 12;

  // Fetch teachers for filter
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await getTeachers(1, 100);
        setTeachers(response.data || []);
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      }
    };
    fetchTeachers();
  }, []);

  // Fetch exams with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExams(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTeacherId, selectedStatus]);

  const fetchExams = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getAcademyExams(page, itemsPerPage, { 
        search: searchQuery,
        teacher_id: selectedTeacherId || undefined
      });
      setExams(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('حدث خطأ أثناء تحميل الامتحانات');
    } finally {
      setLoading(false);
    }
  };

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('.actions-menu') && !target.closest('button')) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleToggleStatus = async (exam: Exam) => {
    try {
      await toggleAcademyExamStatus(exam.id.toString());
      toast.success(exam.is_active ? 'تم إلغاء تفعيل الامتحان' : 'تم تفعيل الامتحان');
      fetchExams(currentPage);
    } catch (error: any) {
      console.error('Error toggling exam status:', error);
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تغيير حالة الامتحان');
    }
  };

  const handleEndExam = (exam: Exam) => {
    setExamToEnd(exam);
    setIsEndModalOpen(true);
    setOpenMenuId(null);
  };

  const confirmEndExam = async () => {
    if (!examToEnd) return;

    setIsProcessing(true);
    try {
      await endAcademyExam(examToEnd.id.toString());
      toast.success('تم إنهاء الامتحان بنجاح');
      fetchExams(currentPage);
      setIsEndModalOpen(false);
      setExamToEnd(null);
    } catch (error: any) {
      console.error('Error ending exam:', error);
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنهاء الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (exam: Exam) => {
    setExamToCopy(exam);
    setNewExamTitle(exam.title + ' (نسخة)');
    setIsCopyModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmCopy = async () => {
    if (!examToCopy || !newExamTitle.trim()) return;

    setIsProcessing(true);
    try {
      await copyAcademyExam(examToCopy.id.toString(), newExamTitle);
      toast.success('تم نسخ الامتحان بنجاح');
      fetchExams(currentPage);
      setIsCopyModalOpen(false);
      setExamToCopy(null);
      setNewExamTitle('');
    } catch (error) {
      console.error('Error copying exam:', error);
      toast.error('فشل نسخ الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;

    setIsProcessing(true);
    try {
      await deleteAcademyExam(examToDelete.id.toString());
      toast.success('تم حذف الامتحان بنجاح');
      fetchExams(currentPage);
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('حدث خطأ أثناء حذف الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate stats
  const totalExams = totalItems;
  const activeExams = exams.filter(e => e.is_active).length;
  const upcomingExams = exams.filter(e => !e.is_active && !e.ended_at && new Date(e.date) > new Date()).length;
  const completedExams = exams.filter(e => !!e.ended_at).length;

  // Filter exams based on selected status
  const filteredExams = React.useMemo(() => {
    let result = exams;
    
    // Filter by status
    if (selectedStatus) {
      const now = new Date();
      result = result.filter(e => {
        switch (selectedStatus) {
          case 'active':
            return e.is_active;
          case 'upcoming':
            return !e.is_active && !e.ended_at && new Date(e.date) > now;
          case 'ended':
            return !!e.ended_at;
          default:
            return true;
        }
      });
    }
    
    return result;
  }, [exams, selectedStatus]);

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الامتحانات"
          value={totalExams}
          icon="file-alt"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="امتحانات نشطة"
          value={activeExams}
          icon="play-circle"
          color="success"
          variant="centered"
        />
        <StatCard
          title="امتحانات قادمة"
          value={upcomingExams}
          icon="calendar-alt"
          color="warning"
          variant="centered"
        />
        <StatCard
          title="امتحانات منتهية"
          value={completedExams}
          icon="check-circle"
          color="danger"
          variant="centered"
        />
      </div>

      {/* Header Section */}
      <div className="header-section flex justify-between items-center mb-6 max-md:flex-col max-md:items-stretch max-md:gap-4">
        <div className="header-title flex items-center gap-3 max-md:w-full max-md:justify-center">
          <div className="w-12 h-12 rounded-xl bg-[rgba(66,99,235,0.1)] flex items-center justify-center text-primary text-2xl">
            <Icon name="file-alt" />
          </div>
          <h2 className="text-2xl font-bold text-white m-0">إدارة الامتحانات</h2>
        </div>
        <div className="header-actions max-md:w-full">
          <Button onClick={() => router.push('/academy/exams/add')} variant="primary" className="max-md:w-full max-md:justify-center">
            <Icon name="plus" />
            <span>امتحان جديد</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 max-md:flex-col">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="بحث عن امتحان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-64 max-md:w-full">
          <Filter
            options={[
              { value: '', label: 'كل المدرسين' },
              ...teachers.map(teacher => ({ value: String(teacher.id), label: teacher.name }))
            ]}
            value={selectedTeacherId}
            onChange={(value) => setSelectedTeacherId(value)}
            placeholder="كل المدرسين"
            className="w-full"
          />
        </div>
        <div className="w-48 max-md:w-full">
          <Filter
            options={[
              { value: '', label: 'كل الحالات' },
              { value: 'active', label: 'نشط' },
              { value: 'upcoming', label: 'قادم' },
              { value: 'ended', label: 'منتهي' },
            ]}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            placeholder="الحالة"
            className="w-full"
          />
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="exams-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl bg-[#101426]/15 border border-white/10 h-[280px] flex flex-col gap-4 p-6">
              <div className="flex justify-between items-start">
                <div className="skeleton-item w-[60%] h-6"></div>
                <div className="skeleton-item w-[20%] h-6 rounded-xl"></div>
              </div>
              <div className="skeleton-item w-full h-10"></div>
              <div className="flex flex-col gap-3 mt-auto">
                <div className="skeleton-item w-[40%] h-4"></div>
                <div className="skeleton-item w-[50%] h-4"></div>
                <div className="skeleton-item w-[30%] h-4"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="skeleton-item flex-1 h-9 rounded-lg"></div>
                <div className="skeleton-item flex-1 h-9 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center p-12 bg-white/2 rounded-2xl">
          <Icon name="file-alt" size="2x" className="mb-4 opacity-50" />
          <p className="text-gray-light text-lg">لا توجد امتحانات</p>
          <Button onClick={() => router.push('/academy/exams/add')} variant="primary" className="mt-4">
            <Icon name="plus" />
            <span>إضافة امتحان جديد</span>
          </Button>
        </div>
      ) : (
        <div className="exams-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const isMenuOpen = openMenuId === exam.id;
            return (
              <ExamCard
                key={exam.id}
                exam={exam}
                isMenuOpen={isMenuOpen}
                onMenuToggle={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : exam.id);
                }}
                onViewDetails={() => {
                  router.push(`/academy/exams/${exam.id}`);
                  setOpenMenuId(null);
                }}
                onViewResults={() => {
                  router.push(`/academy/exams/${exam.id}/results`);
                  setOpenMenuId(null);
                }}
                onEdit={() => {
                  router.push(`/academy/exams/${exam.id}/edit`);
                  setOpenMenuId(null);
                }}
                onCopy={() => handleCopy(exam)}
                onDelete={() => {
                  setExamToDelete(exam);
                  setIsDeleteModalOpen(true);
                  setOpenMenuId(null);
                }}
                onToggleStatus={() => handleToggleStatus(exam)}
                onEnd={() => handleEndExam(exam)}
              />
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => fetchExams(currentPage - 1)}
          >
            السابق
          </Button>
          <span className="flex items-center text-gray-light">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => fetchExams(currentPage + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {/* End Exam Modal */}
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

      {/* Delete Exam Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="حذف الامتحان"
        message={`هل أنت متأكد من حذف امتحان "${examToDelete?.title}"؟ سيتم حذف جميع أسئلة ونتائج هذا الامتحان نهائياً. لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        onConfirm={confirmDeleteExam}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setExamToDelete(null);
        }}
        isProcessing={isProcessing}
        variant="danger"
      />

      {/* Copy Modal */}
      <FormModal
        isOpen={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          setExamToCopy(null);
          setNewExamTitle('');
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmCopy();
        }}
        title="نسخ الامتحان"
        isLoading={isProcessing}
        submitText={isProcessing ? 'جاري النسخ...' : 'نسخ'}
        cancelText="إلغاء"
        maxWidth="500px"
      >
        <div className="form-group">
          <label htmlFor="newExamTitle">اسم النسخة الجديدة</label>
          <Input
            type="text"
            id="newExamTitle"
            value={newExamTitle}
            onChange={(e) => setNewExamTitle(e.target.value)}
            placeholder="أدخل اسم النسخة"
            autoFocus
            required
          />
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
