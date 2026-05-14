'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExamCard } from '@/components/dashboard/ExamCard';
import { LoadingSpinner, Button, FormModal, Icon, Input } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getExams, toggleExamStatus, endExam, copyExam, deleteExam, getAuthToken } from '@/services/authService';
import { getGroups, Group } from '@/services/groupService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Filter } from '@/components/Filter';
import { toast } from 'react-hot-toast';

interface Exam {
  id: number | string;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  group?: { id: string; name: string };
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

export default function ExamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  
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

  // Fetch groups for filter
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await getGroups(1, 100);
        setGroups(response.data || []);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    fetchGroups();
  }, []);

  // Fetch exams with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExams(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGroupId, selectedStatus]);

  const fetchExams = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getExams(page, itemsPerPage, { 
        search: searchQuery
      });
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

  // Real-time updates with WebSocket
  useEffect(() => {
    if (!user?.id) return;
    
    const token = getAuthToken();
    if (!token) return;

    import('@/lib/echo').then(({ initializeEcho }) => {
      const echo = initializeEcho(token);
      
      // Subscribe to teacher notifications channel
      const notificationChannel = echo.private(`notifications.teacher.${user.id}`);
      notificationChannel.notification((notification: any) => {
        console.log('Exam notification received:', notification);
        
        if (notification.type === 'exam_status') {
          const examId = notification.exam_id;
          const isActive = notification.status === 'active';
          const isEnded = notification.status === 'ended';
          
          console.log('Updating exam status from notification:', examId, notification.status);
          
          toast.success(notification.message || `تحديث حالة الامتحان`, {
            duration: 4000,
            position: 'top-center',
            icon: isActive ? '🟢' : (isEnded ? '🔴' : '⚪'),
          });
          
          setExams((prevExams) => {
            return prevExams.map((exam) => {
              if (String(exam.id) === String(examId)) {
                return {
                  ...exam,
                  is_active: isActive,
                  activated_at: isActive ? new Date().toISOString() : exam.activated_at,
                  ended_at: isEnded ? new Date().toISOString() : exam.ended_at,
                };
              }
              return exam;
            });
          });
          
          fetchExams(currentPage);
        }
      });

      // Polling fallback (every 30 seconds)
      const pollInterval = setInterval(() => {
        fetchExams(currentPage);
      }, 30000);

      return () => {
        echo.leave(`notifications.teacher.${user.id}`);
        clearInterval(pollInterval);
      };
    });
  }, [user?.id, currentPage]);

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
      await toggleExamStatus(exam.id.toString());
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
      await copyExam(examToCopy.id.toString(), newExamTitle);
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
      await deleteExam(examToDelete.id.toString());
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
    
    // Filter by group
    if (selectedGroupId) {
      result = result.filter(e => e.group?.id === selectedGroupId);
    }
    
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
  }, [exams, selectedGroupId, selectedStatus]);

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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الامتحانات"
          value={totalExams}
          icon="fas fa-file-alt"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="امتحانات نشطة"
          value={activeExams}
          icon="fas fa-play-circle"
          color="success"
          variant="centered"
        />
        <StatCard
          title="امتحانات قادمة"
          value={upcomingExams}
          icon="fas fa-calendar-alt"
          color="warning"
          variant="centered"
        />
        <StatCard
          title="امتحانات منتهية"
          value={completedExams}
          icon="fas fa-check-circle"
          color="danger"
          variant="centered"
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary premium-border">
                <Icon name="file-alt" size="xl" />
             </div>
             <h2 className="text-3xl font-black text-white tracking-tight">إدارة الامتحانات</h2>
          </div>
          <p className="text-gray-light/40 font-medium px-1">قم بإنشاء وتتبع الامتحانات والنتائج لطلابك</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push('/teacher/exams/add')} 
            variant="primary" 
            className="h-12 px-6 rounded-2xl font-bold gap-2 shadow-[0_0_30px_rgba(66,99,235,0.2)] hover:shadow-[0_0_40px_rgba(66,99,235,0.4)] transition-all"
          >
            <Icon name="plus" />
            <span>إضافة امتحان جديد</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="premium-glass p-4 rounded-[2rem] border-white/5 mb-8 relative z-30">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-light/20 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="بحث عن اسم الامتحان أو المادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white/5 border-white/5 group-hover:border-white/10 rounded-2xl pr-12 font-bold placeholder:text-gray-light/10 transition-all focus:bg-white/10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <Filter
                options={[
                  { value: '', label: 'كل المجموعات' },
                  ...groups.map(group => ({ value: String(group.id), label: group.name }))
                ]}
                value={selectedGroupId}
                onChange={(value) => setSelectedGroupId(value)}
                placeholder="تصفية حسب المجموعة"
                className="h-14 bg-white/5 border-white/5 rounded-2xl font-bold"
              />
            </div>
            <div className="w-full sm:w-48">
              <Filter
                options={[
                  { value: '', label: 'كل الحالات' },
                  { value: 'active', label: 'نشط الآن' },
                  { value: 'upcoming', label: 'قادم قريباً' },
                  { value: 'ended', label: 'منتهي' },
                ]}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                placeholder="الحالة"
                className="h-14 bg-white/5 border-white/5 rounded-2xl font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[340px] rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden animate-pulse">
               <div className="p-7 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="w-24 h-6 bg-white/5 rounded-full" />
                     <div className="w-10 h-10 bg-white/5 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                     <div className="w-3/4 h-8 bg-white/10 rounded-lg" />
                     <div className="w-1/2 h-4 bg-white/5 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="h-14 bg-white/5 rounded-2xl" />
                     <div className="h-14 bg-white/5 rounded-2xl" />
                  </div>
                  <div className="h-11 bg-white/10 rounded-xl mt-auto" />
               </div>
            </div>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="premium-glass p-20 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center">
           <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-gray-light/10 mb-8 premium-border">
              <Icon name="file-invoice" size="3x" />
           </div>
           <h3 className="text-2xl font-black text-white mb-3">لا توجد امتحانات حالياً</h3>
           <p className="text-gray-light/30 max-w-md mb-10 font-medium">
              {searchQuery || selectedGroupId || selectedStatus 
                ? 'لم نجد أي امتحانات تطابق خيارات التصفية التي اخترتها. جرب تغيير كلمات البحث أو الفلاتر.' 
                : 'ابدأ بإنشاء أول امتحان لطلابك الآن لمتابعة مستواهم الدراسي.'}
           </p>
           <Button 
             onClick={() => router.push('/teacher/exams/add')} 
             variant="primary" 
             className="h-12 px-8 rounded-2xl font-bold gap-2"
           >
             <Icon name="plus" />
             <span>إضافة أول امتحان</span>
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
                  router.push(`/teacher/exams/${exam.id}`);
                  setOpenMenuId(null);
                }}
                onViewResults={() => {
                  router.push(`/teacher/exams/${exam.id}/results`);
                  setOpenMenuId(null);
                }}
                onEdit={() => {
                  router.push(`/teacher/exams/${exam.id}/edit`);
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
        submitText={isProcessing ? 'جاري النسخ...' : 'تأكيد النسخ'}
        cancelText="إلغاء"
        maxWidth="500px"
      >
        <div className="space-y-6 py-2">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name="info-circle" />
             </div>
             <div className="space-y-1">
                <p className="text-xs font-black text-primary uppercase tracking-widest leading-none">تنبيه</p>
                <p className="text-[11px] font-bold text-gray-light/60 leading-relaxed">سيتم نسخ كافة الأسئلة والإعدادات، ولكن لن يتم نسخ نتائج الطلاب أو بيانات الحضور من النسخة الأصلية.</p>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">اسم النسخة الجديدة</label>
            <Input
              type="text"
              id="newExamTitle"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              placeholder="أدخل اسم النسخة الجديدة هنا..."
              className="h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-bold focus:bg-white/10 transition-all"
              autoFocus
              required
            />
          </div>
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
