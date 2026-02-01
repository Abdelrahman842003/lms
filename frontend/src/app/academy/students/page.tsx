'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAcademyStudents, getAcademyStudentStatistics, deleteAcademyStudent, toggleAcademyStudentStatus } from '@/services/academyService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui';

import { LinkTeacherModal } from './LinkTeacherModal';
import { TeacherSelectionModal } from './TeacherSelectionModal';

export default function AcademyStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    variant: 'danger' as 'danger' | 'success',
    onConfirm: async () => {},
    showCancel: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Link Teacher Modal State
  const [linkTeacherModalOpen, setLinkTeacherModalOpen] = useState(false);
  const [selectedStudentForLink, setSelectedStudentForLink] = useState<any>(null);

  // Teacher Selection Modal State
  const [teacherSelectionModalOpen, setTeacherSelectionModalOpen] = useState(false);
  const [teacherSelectionConfig, setTeacherSelectionConfig] = useState({
    student: null as any,
    title: '',
    message: '',
    confirmText: '',
    variant: 'danger' as 'danger' | 'success',
  });

  // Teachers Popup State
  const [activeTeacherPopup, setActiveTeacherPopup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActiveTeacherPopup(null);
      }
    }

    if (activeTeacherPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTeacherPopup]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchQuery, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await getAcademyStudentStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };



  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await getAcademyStudents(currentPage, 10, searchQuery, statusFilter);
      console.log('FULL API RESPONSE:', response);
      
      // Robust data extraction
      let studentsData = [];
      let metaData: any = {};

      if (response?.data?.data && Array.isArray(response.data.data)) {
         studentsData = response.data.data;
         metaData = response.data.meta || {};
      } else if (response?.data && Array.isArray(response.data)) {
         studentsData = response.data;
      } else if (Array.isArray(response)) {
         studentsData = response;
      }
      
      console.log('Extracted Students:', studentsData);
      setStudents(studentsData);
      setTotalPages(metaData.last_page || response.data?.last_page || 1);
      setTotalItems(metaData.total || response.data?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      toast.error(`Failed to load students: ${error.message || 'Unknown error'}`);
      if (error.response) {
        console.error('Error Response:', error.response);
        toast.error(`Status: ${error.response.status}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (student: any) => {
    setModalConfig({
      title: 'إلغاء ربط الطالب',
      message: `هل أنت متأكد من إلغاء ربط الطالب "${student.name}" من الأكاديمية؟ (لن يتم حذف حساب الطالب نهائياً)`,
      confirmText: 'إلغاء الربط',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await deleteAcademyStudent(student.id);
          setModalOpen(false);
          fetchStudents();
          fetchStudents();
          fetchStats();
          toast.success('تم إلغاء ربط الطالب بنجاح');
        } catch (error) {
          console.error('Failed to delete student:', error);
          toast.error('فشل إلغاء ربط الطالب');
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  const handleTeacherSelectionConfirm = async (teacherId: string) => {
    const student = teacherSelectionConfig.student;
    const teacher = student.teachers.find((t: any) => t.id === teacherId);
    const isDisabling = teacher?.is_active;
    
    try {
      await toggleAcademyStudentStatus(student.id, teacherId);
      // Manually update the local state to reflect changes immediately
      setTeacherSelectionConfig(prev => {
        if (!prev.student) return prev;
        
        const updatedTeachers = prev.student.teachers.map((t: any) => {
          if (t.id === teacherId) {
            return { ...t, is_active: !t.is_active };
          }
          return t;
        });

        return {
          ...prev,
          student: {
            ...prev.student,
            teachers: updatedTeachers
          }
        };
      });

      // Also refresh the main list in background
      await fetchStudents();
      
      toast.success(`تم ${isDisabling ? 'تعطيل' : 'تفعيل'} الحساب بنجاح`);
    } catch (error) {
      console.error('Failed to toggle student status:', error);
      toast.error(`فشل ${isDisabling ? 'تعطيل' : 'تفعيل'} الحساب`);
    }
  };

  const handleToggleStatus = (student: any) => {
    // Check if student has multiple teachers
    if (student.teachers && student.teachers.length > 1) {
      setTeacherSelectionConfig({
        student: student,
        title: 'إدارة حالة الطالب',
        message: '', // Not used in new design
        confirmText: '', // Not used
        variant: 'success', // Not used
      });
      setTeacherSelectionModalOpen(true);
      return;
    }

    // If single teacher or no teachers (fallback), use existing logic but pass teacherId if available
    const teacherId = student.teachers && student.teachers.length === 1 ? student.teachers[0].id : undefined;
    const isDisabling = student.is_active;
    
    setModalConfig({
      title: isDisabling ? 'تعطيل الحساب' : 'تفعيل الحساب',
      message: `هل أنت متأكد من ${isDisabling ? 'تعطيل' : 'تفعيل'} حساب الطالب "${student.name}"؟`,
      confirmText: isDisabling ? 'تعطيل' : 'تفعيل',
      variant: isDisabling ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await toggleAcademyStudentStatus(student.id, teacherId);
          setModalOpen(false);
          fetchStudents();
          fetchStats();
          toast.success(`تم ${isDisabling ? 'تعطيل' : 'تفعيل'} الحساب بنجاح`);
        } catch (error) {
          console.error('Failed to toggle student status:', error);
          toast.error(`فشل ${isDisabling ? 'تعطيل' : 'تفعيل'} الحساب`);
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
      render: (_: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4263EB] to-[#3730A3] flex items-center justify-center overflow-hidden shrink-0">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-[0.9rem]">
                {row.name?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className={`font-semibold ${row.is_active ? '' : 'text-gray-light'}`}>
              {row.name}
            </span>
            <div className="flex items-center gap-2 text-xs">
              {row.is_active ? (
                <span className="text-success flex items-center gap-1">
                  نشط
                </span>
              ) : (
                <span className="text-gray-400">غير مفعل</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'teachers',
      label: 'المدرسين',
      render: (_: any, row: any) => {
        const hasInactiveTeacher = row.teachers?.some((t: any) => !t.is_active);
        const hasTeachers = row.teachers && row.teachers.length > 0;
        
        return (
        <div className="flex items-center gap-2">
          <button 
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              hasTeachers
                ? hasInactiveTeacher
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
            onClick={(e) => {
              if (!row.teachers || row.teachers.length === 0) return;
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setPopupPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
              });
              setActiveTeacherPopup(row.id);
            }}
          >
            {row.teachers_count || 0}
          </button>
        </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'رقم الطالب',
      render: (_: any, row: any) => row.phone || '-',
      className: 'd-none-md',
    },
    {
      key: 'grade',
      label: 'الصف الدراسي',
      render: (_: any, row: any) => row.grade_name || '-',
      className: 'd-none-lg',
    },
  ];

  const actions = [
    {
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: any) => router.push(`/academy/students/${row.id}`),
    },
    {
      label: 'ربط مدرس',
      icon: 'fas fa-link',
      onClick: (row: any) => {
        setSelectedStudentForLink(row);
        setLinkTeacherModalOpen(true);
      },
    },
    {
      label: 'تسجيل دفعة',
      icon: 'fas fa-money-bill-wave',
      onClick: (row: any) => router.push(`/academy/students/${row.id}/payment`),
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: any) => router.push(`/academy/students/${row.id}/edit`),
    },
    {
      label: (row: any) => row.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب',
      icon: (row: any) => row.is_active ? 'fas fa-ban' : 'fas fa-check-circle',
      variant: (row: any) => row.is_active ? 'danger' : 'success',
      onClick: (row: any) => handleToggleStatus(row),
    },
    {
      label: 'إلغاء ربط',
      icon: 'fas fa-trash-alt',
      variant: 'danger' as 'danger',
      onClick: (row: any) => handleDelete(row),
    },
  ];

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الطلاب"
          icon="fas fa-graduation-cap"
          value={stats?.total_students || 0}
          color="primary"
        />
        <StatCard
          title="الطلاب النشطين"
          icon="fas fa-user-check"
          value={stats?.active_students || 0}
          color="success"
        />
        <StatCard
          title="إجمالي التسجيلات"
          icon="fas fa-users"
          value={stats?.total_enrollments || 0}
          trend={{ 
            value: Math.abs(stats?.total_enrollments_trend || 0), 
            label: 'تسجيل', 
            isPositive: (stats?.total_enrollments_trend || 0) >= 0 
          }}
          color="info"
        />
        <StatCard
          title="التسجيلات النشطة"
          icon="fas fa-user-check"
          value={stats?.active_enrollments || 0}
          trend={{ 
            value: Math.abs(stats?.active_enrollments_trend || 0), 
            label: 'تسجيل', 
            isPositive: (stats?.active_enrollments_trend || 0) >= 0 
          }}
          color="success"
        />
      </div>

      <DashboardCard
        title="قائمة الطلاب"
        icon="fas fa-table"
      >
        <DataTable
          columns={columns}
          data={students}
          actions={actions}
          isLoading={isLoading}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          onSearch={setSearchQuery}
          headerActions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Filter
                options={[
                  { value: '', label: 'كل الطلاب' },
                  { value: 'active', label: 'الطلاب النشطين' },
                  { value: 'inactive', label: 'الطلاب المعطلين' }
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="w-full sm:w-auto min-w-[150px]"
              />

              <Link href="/academy/students/add" className="btn btn-primary w-full sm:w-auto justify-center">
                <i className="fas fa-plus"></i>
                <span>إضافة طالب جديد</span>
              </Link>
            </div>
          }
          rowClassName={(row) => row.is_active ? '' : 'bg-red-500/5 text-gray-500'}
        />
      </DashboardCard>

      <ConfirmationModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
        isProcessing={isProcessing}
        showCancel={modalConfig.showCancel}
      />

      {/* Link Teacher Modal */}
      {selectedStudentForLink && (
        <LinkTeacherModal
          isOpen={linkTeacherModalOpen}
          onClose={() => setLinkTeacherModalOpen(false)}
          student={selectedStudentForLink}
          onSuccess={() => {
            fetchStudents();
            fetchStats();
          }}
        />
      )}

      {/* Teacher Selection Modal */}
      <TeacherSelectionModal
        isOpen={teacherSelectionModalOpen}
        onClose={() => setTeacherSelectionModalOpen(false)}
        teachers={teacherSelectionConfig.student?.teachers || []}
        onConfirm={handleTeacherSelectionConfirm}
        title={teacherSelectionConfig.title}
        message={teacherSelectionConfig.message}
        confirmText={teacherSelectionConfig.confirmText}
        variant={teacherSelectionConfig.variant}
      />

      {/* Teachers Popup */}
      {activeTeacherPopup && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          className="absolute z-[9999] bg-[#1E1E2D] border border-white/10 rounded-xl shadow-xl p-4 min-w-[250px] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: popupPosition.top,
            left: popupPosition.left,
          }}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <h4 className="text-sm font-bold text-white">المدرسين المرتبطين</h4>
            <button 
              onClick={() => setActiveTeacherPopup(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {students.find(s => s.id === activeTeacherPopup)?.teachers?.map((teacher: any) => {
              console.log('Teacher object in popup:', teacher);
              console.log('teacher.status:', teacher.status);
              console.log('teacher.is_active:', teacher.is_active);
              return (
              <div key={teacher.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {teacher.name?.charAt(0) || '?'}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-medium">{teacher.name}</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* نشط - يظهر إذا is_active = true */}
                      {teacher.is_active && (
                        <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">
                          نشط
                        </span>
                      )}
                      {/* فترة تجريبية */}
                      {teacher.status === 'trial' && (
                        <span className="text-[10px] bg-[#f39c12]/20 text-[#f39c12] px-1.5 py-0.5 rounded">
                          فترة تجريبية ({teacher.trial_days_left !== undefined ? `${Math.ceil(teacher.trial_days_left)} يوم` : 'متبقي'})
                        </span>
                      )}
                      {/* نشط مع اشتراك - يظهر الأيام المتبقية */}
                      {teacher.status === 'active' && teacher.days_left > 0 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          {Math.ceil(teacher.days_left)} يوم متبقي
                        </span>
                      )}
                      {/* فترة سماح */}
                      {teacher.status === 'grace_period' && (
                        <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                          فترة سماح ({teacher.days_left > 0 ? `${Math.ceil(teacher.days_left)} يوم` : '0 يوم'})
                        </span>
                      )}
                      {/* منتهي */}
                      {teacher.status === 'expired' && (
                        <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                          منتهي
                        </span>
                      )}
                      {/* غير نشط */}
                      {!teacher.is_active && (
                        <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                          غير نشط
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{teacher.grade_name || '-'}</span>
                    <span>•</span>
                    <span>{teacher.group_name || '-'}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
}
