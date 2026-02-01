'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExamCard } from '@/components/dashboard/ExamCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getExams, toggleExamStatus, endExam, copyExam, deleteExam } from '@/services/authService';
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
    
    const token = localStorage.getItem('token');
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
      <div className="header-section flex justify-between items-center mb-6 max-md:flex-col max-md:items-stretch max-md:gap-4">
        <div className="header-title flex items-center gap-3 max-md:w-full max-md:justify-center">
          <div className="w-12 h-12 rounded-xl bg-[rgba(66,99,235,0.1)] flex items-center justify-center text-primary text-2xl">
            <i className="fas fa-file-alt"></i>
          </div>
          <h2 className="text-2xl font-bold text-white m-0">إدارة الامتحانات</h2>
        </div>
        <div className="header-actions max-md:w-full">
          <button onClick={() => router.push('/teacher/exams/add')} className="btn btn-primary max-md:w-full max-md:justify-center">
            <i className="fas fa-plus"></i>
            <span>امتحان جديد</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 max-md:flex-col">
        <div className="flex-1">
          <input
            type="text"
            placeholder="بحث عن امتحان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
          />
        </div>
        <div className="w-64 max-md:w-full">
          <Filter
            options={[
              { value: '', label: 'كل المجموعات' },
              ...groups.map(group => ({ value: String(group.id), label: group.name }))
            ]}
            value={selectedGroupId}
            onChange={(value) => setSelectedGroupId(value)}
            placeholder="كل المجموعات"
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
          <i className="fas fa-file-alt text-5xl text-gray-light mb-4 opacity-50"></i>
          <p className="text-gray-light text-lg">لا توجد امتحانات</p>
          <button onClick={() => router.push('/teacher/exams/add')} className="btn btn-primary mt-4">
            <i className="fas fa-plus"></i>
            <span>إضافة امتحان جديد</span>
          </button>
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
          <button 
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={() => fetchExams(currentPage - 1)}
          >
            السابق
          </button>
          <span className="flex items-center text-gray-light">
            صفحة {currentPage} من {totalPages}
          </span>
          <button 
            className="btn btn-outline btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => fetchExams(currentPage + 1)}
          >
            التالي
          </button>
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
      {isCopyModalOpen && (
        <div className="modal-overlay" onClick={() => {
          setIsCopyModalOpen(false);
          setExamToCopy(null);
          setNewExamTitle('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>نسخ الامتحان</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setIsCopyModalOpen(false);
                  setExamToCopy(null);
                  setNewExamTitle('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="newExamTitle">اسم النسخة الجديدة</label>
                <input
                  type="text"
                  id="newExamTitle"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="form-input"
                  placeholder="أدخل اسم النسخة"
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setIsCopyModalOpen(false);
                  setExamToCopy(null);
                  setNewExamTitle('');
                }}
                className="btn btn-outline"
                disabled={isProcessing}
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmCopy}
                className="btn btn-primary"
                disabled={isProcessing || !newExamTitle.trim()}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>جاري النسخ...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-copy"></i>
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
