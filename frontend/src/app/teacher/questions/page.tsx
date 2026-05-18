'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button, Icon, Input, Select } from '@/components/ui';
import { getQuestions, deleteQuestion, updateQuestion, createQuestion, Question } from '@/services/teacher/modules/questionsService';
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
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchQuestions(1);
  }, [searchQuery, selectedType, selectedDifficulty]);

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedType) filters.type = selectedType;
      if (selectedDifficulty) filters.difficulty = selectedDifficulty;

      const response = await getQuestions(page, itemsPerPage, filters);
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
        await updateQuestion(formData.id, formData);
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        // Create
        await createQuestion(formData);
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
      await deleteQuestion(questionToDelete.id);
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
          <span className={`font-black text-xs ${d.color}`}>
            {d.label}
          </span>
        );
      },
    },
    {
      key: 'is_locked',
      label: 'الحالة',
      render: (isLocked: boolean) => (
        isLocked ? (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
            <Icon name="lock" size={12} />
            مستخدم
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <Icon name="unlock" size={12} />
            متاح
          </span>
        )
      ),
    },
  ];

  const actions = [
    {
      label: 'تعديل',
      icon: 'edit',
      onClick: (question: Question) => handleEditClick(question),
      disabled: (question: Question) => !!question.is_locked,
    },
    {
      label: 'حذف',
      icon: 'trash',
      variant: 'danger' as const,
      onClick: (question: Question) => handleDeleteClick(question),
      disabled: (question: Question) => !!question.is_locked,
    },
  ];

  const mobileRenderer = (question: Question) => {
    const types: any = {
      mcq: { label: 'اختيار من متعدد', color: 'bg-primary/20 text-primary' },
      true_false: { label: 'صح أو خطأ', color: 'bg-emerald-500/20 text-emerald-400' },
      ordering: { label: 'ترتيب', color: 'bg-amber-500/20 text-amber-400' },
      matching: { label: 'توصيل', color: 'bg-purple-500/20 text-purple-400' },
    };
    const t = types[question.type] || { label: question.type, color: 'bg-gray-500/20 text-gray-400' };
    
    const levels: any = {
      easy: { label: 'سهل', color: 'text-emerald-400' },
      medium: { label: 'متوسط', color: 'text-amber-400' },
      hard: { label: 'صعب', color: 'text-rose-400' },
    };
    const d = levels[question.difficulty] || { label: question.difficulty, color: 'text-gray-400' };

    return (
      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${t.color}`}>
            {t.label}
          </span>
          <span className={`font-black text-xs ${d.color}`}>
            {d.label}
          </span>
        </div>
        <p className="text-white text-sm font-medium line-clamp-3">
          {question.text}
        </p>
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          {question.is_locked ? (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
              <Icon name="lock" size={12} />
              مستخدم
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <Icon name="unlock" size={12} />
              متاح
            </span>
          )}
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" className="h-8 w-8 rounded-lg bg-white/5" onClick={() => handleEditClick(question)} disabled={!!question.is_locked}>
              <Icon name="edit" size="xs" />
            </Button>
            <Button size="xs" variant="ghost" className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400" onClick={() => handleDeleteClick(question)} disabled={!!question.is_locked}>
              <Icon name="trash" size="xs" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <SectionHeader 
          title="بنك الأسئلة" 
          subtitle="إدارة جميع الأسئلة المتاحة للامتحانات والتمارين"
          action={
            <Button variant="primary" className="gap-2" onClick={handleAddClick}>
              <Icon name="plus" />
              إضافة سؤال جديد
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
          <div className="md:col-span-2">
            <Input
              placeholder="ابحث عن سؤال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
            />
          </div>
          <div>
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
            />
          </div>
          <div>
            <Select
              options={[
                { value: '', label: 'كل مستويات الصعوبة' },
                { value: 'easy', label: 'سهل' },
                { value: 'medium', label: 'متوسط' },
                { value: 'hard', label: 'صعب' },
              ]}
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={questions}
          actions={actions}
          isLoading={loading}
          pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={fetchQuestions}
          totalItems={totalItems}
          emptyMessage="لا توجد أسئلة في بنك الأسئلة حالياً"
          emptyIcon="database"
          mobileRenderer={mobileRenderer}
        />

        <QuestionEditorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          question={questionToEdit}
          onSave={handleSaveQuestion}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="حذف السؤال"
          message={`هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          isProcessing={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
