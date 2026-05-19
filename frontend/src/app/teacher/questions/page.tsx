'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button, Icon, Input, Select } from '@/components/ui';
import { getQuestions, deleteQuestion, updateQuestion, createQuestion, Question } from '@/services/teacher/modules/questionsService';
import { 
  getAcademyQuestions, 
  createAcademyQuestion, 
  updateAcademyQuestion, 
  deleteAcademyQuestion 
} from '@/services/academy/modules/questionsService';
import { getGrades as getTeacherGrades } from '@/services/teacherService';
import { getGrades as getAcademyGrades, getTeachers } from '@/services/academyService';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { QuestionEditorModal } from '@/components/dashboard/QuestionEditorModal';

export default function QuestionsPage({ role = 'teacher' }: { role?: 'teacher' | 'academy' | 'student' | 'secretary' }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  const [grades, setGrades] = useState<{ id: string, name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string, name: string }[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchInitialData();
  }, [role]);

  useEffect(() => {
    fetchQuestions(1);
  }, [searchQuery, selectedType, selectedDifficulty, selectedGrade, selectedTeacher]);

  const extractArray = <T,>(res: unknown): T[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res as T[];
    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as T[];
      if (obj.data && typeof obj.data === 'object' && obj.data !== null) {
        const nestedData = obj.data as Record<string, unknown>;
        if (Array.isArray(nestedData.data)) return nestedData.data as T[];
        if (Array.isArray(nestedData.teachers)) return nestedData.teachers as T[];
      }
    }
    return [];
  };

  const fetchInitialData = async () => {
    try {
      if (role === 'teacher') {
        const response = await getTeacherGrades();
        setGrades(extractArray<{ id: string; name: string }>(response));
      } else if (role === 'academy') {
        const [gradesRes, teachersRes] = await Promise.all([
          getAcademyGrades(1, 100),
          getTeachers(1, 100)
        ]);
        setGrades(extractArray<{ id: string; name: string }>(gradesRes));
        setTeachers(extractArray<{ id: string; name: string }>(teachersRes));
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedType) filters.type = selectedType;
      if (selectedDifficulty) filters.difficulty = selectedDifficulty;
      if (selectedGrade) filters.grade_id = selectedGrade;
      if (selectedTeacher) filters.teacher_id = selectedTeacher;

      let response;
      if (role === 'academy') {
        response = await getAcademyQuestions(page, itemsPerPage, filters);
      } else {
        response = await getQuestions(page, itemsPerPage, filters);
      }

      setQuestions(response.data);
      setTotalPages(response.last_page);
      setTotalItems(response.total);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('فشل في تحميل بنك الأسئلة');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setQuestionToEdit(null); // Explicitly null for creation
    setIsEditModalOpen(true);
  };

  const handleEditClick = (question: Question) => {
    if (question.is_locked) {
      toast.error('لا يمكن تعديل هذا السؤال لأنه مستخدم في امتحانات نشطة');
      return;
    }
    setQuestionToEdit(question);
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = async (formData: any) => {
    try {
      if (formData.id) {
        // Update
        if (role === 'academy') {
          await updateAcademyQuestion(formData.id, formData);
        } else {
          await updateQuestion(formData.id, formData);
        }
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        // Create
        if (role === 'academy') {
          await createAcademyQuestion(formData);
        } else {
          await createQuestion(formData);
        }
        toast.success('تم إضافة السؤال للبنك بنجاح');
      }
      fetchQuestions(currentPage);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteClick = (question: Question) => {
    if (question.is_locked) {
      toast.error('لا يمكن حذف هذا السؤال لأنه مستخدم في امتحانات نشطة');
      return;
    }
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    
    try {
      setIsDeleting(true);
      if (role === 'academy') {
        await deleteAcademyQuestion(questionToDelete.id);
      } else {
        await deleteQuestion(questionToDelete.id);
      }
      toast.success('تم حذف السؤال بنجاح');
      fetchQuestions(currentPage);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'فشل في حذف السؤال');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'text',
      label: 'نص السؤال',
      render: (text: string) => (
        <div className="max-w-md truncate font-medium text-white">
          {text}
        </div>
      ),
    },
    ...(role === 'academy' ? [{
      key: 'teacher',
      label: 'المدرس',
      render: (teacher: any) => (
        <span className="text-gray-light/60 font-bold text-xs">
          {teacher?.name || 'غير محدد'}
        </span>
      ),
    }] : []),
    {
      key: 'grade',
      label: 'الصف',
      render: (_: any, record: Question) => {
        const gradeName = grades.find(g => g.id === record.grade_id)?.name || 'غير محدد';
        return (
          <span className="text-gray-light/60 font-bold text-xs">
            {gradeName}
          </span>
        );
      },
    },
    {
      key: 'type',
      label: 'النوع',
      render: (type: string) => {
        const types: any = {
          mcq: { label: 'اختيار من متعدد', color: 'bg-primary/20 text-primary' },
          true_false: { label: 'صح أو خطأ', color: 'bg-emerald-500/20 text-emerald-400' },
          ordering: { label: 'ترتيب', color: 'bg-amber-500/20 text-amber-400' },
          matching: { label: 'توصيل', color: 'bg-purple-500/20 text-purple-400' },
        };
        const t = types[type] || { label: type, color: 'bg-gray-500/20 text-gray-400' };
        return (
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${t.color}`}>
            {t.label}
          </span>
        );
      },
    },
    {
      key: 'difficulty',
      label: 'الصعوبة',
      render: (difficulty: string) => {
        const levels: any = {
          easy: { label: 'سهل', color: 'text-emerald-400' },
          medium: { label: 'متوسط', color: 'text-amber-400' },
          hard: { label: 'صعب', color: 'text-rose-400' },
        };
        const d = levels[difficulty] || { label: difficulty, color: 'text-gray-400' };
        return (
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${d.color.replace('text', 'bg')}`} />
            <span className={`text-[10px] font-bold ${d.color}`}>{d.label}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'إجراءات',
      align: 'left' as const,
      render: (_: any, record: Question) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(record)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-primary p-0"
            disabled={record.is_locked}
          >
            <Icon name="edit" size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(record)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-rose-400 p-0"
            disabled={record.is_locked}
          >
            <Icon name="trash" size="sm" />
          </Button>
        </div>
      ),
    },
  ];

  const Filters = (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="w-full md:w-64">
        <Input
          placeholder="بحث في الأسئلة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon="search"
          className="h-12 bg-white/5 border-white/5 rounded-2xl"
        />
      </div>

      <div className="w-40">
        <Select
          options={[
            { value: '', label: 'كل الأنواع' },
            { value: 'mcq', label: 'اختيار من متعدد' },
            { value: 'true_false', label: 'صح أو خطأ' },
            { value: 'ordering', label: 'ترتيب' },
            { value: 'matching', label: 'توصيل' },
          ]}
          value={selectedType}
          onChange={setSelectedType}
          className="h-12 bg-white/5 border-white/5 rounded-2xl"
        />
      </div>

      <div className="w-40">
        <Select
          options={[
            { value: '', label: 'كل مستويات الصعوبة' },
            { value: 'easy', label: 'سهل' },
            { value: 'medium', label: 'متوسط' },
            { value: 'hard', label: 'صعب' },
          ]}
          value={selectedDifficulty}
          onChange={setSelectedDifficulty}
          className="h-12 bg-white/5 border-white/5 rounded-2xl"
        />
      </div>

      <div className="w-40">
        <Select
          options={[
            { value: '', label: 'كل الصفوف' },
            ...grades.map(g => ({ value: g.id, label: g.name }))
          ]}
          value={selectedGrade}
          onChange={setSelectedGrade}
          className="h-12 bg-white/5 border-white/5 rounded-2xl"
        />
      </div>

      {role === 'academy' && (
        <div className="w-48">
          <Select
            options={[
              { value: '', label: 'كل المدرسين' },
              ...teachers.map(t => ({ value: t.id, label: t.name }))
            ]}
            value={selectedTeacher}
            onChange={setSelectedTeacher}
            className="h-12 bg-white/5 border-white/5 rounded-2xl"
          />
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleAddClick}
        className="h-12 px-6 rounded-2xl font-black mr-auto shadow-lg shadow-primary/20"
      >
        <Icon name="plus" className="ml-2" />
        إضافة سؤال جديد
      </Button>
    </div>
  );

  return (
    <DashboardLayout role={role}>
      <SectionHeader
        title="بنك الأسئلة"
        description="إدارة جميع الأسئلة الخاصة بك لاستخدامها في الامتحانات لاحقاً"
      />

      <div className="mt-8">
        {Filters}

        <DataTable
          columns={columns}
          data={questions}
          loading={loading}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: fetchQuestions,
          }}
          noDataMessage="لا يوجد أسئلة في بنك الأسئلة حالياً"
        />
      </div>

      <QuestionEditorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        question={questionToEdit}
        onSave={handleSaveQuestion}
        grades={grades}
        teachers={teachers}
        role={role as any}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف السؤال"
        message="هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
