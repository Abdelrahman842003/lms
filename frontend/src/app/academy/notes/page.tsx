'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Filter } from '@/components/Filter';
import { Button, Icon, Input, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { noteService, Note } from '@/services/noteService';
import { NoteCard, NoteCardSkeleton } from '@/components/notes/NoteCard';
import { NoteViewerModal } from '@/components/notes/NoteViewerModal';

export default function AcademyNotesPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedNoteForView, setSelectedNoteForView] = useState<Note | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await noteService.getNotes('academy');
      // If the response is paginated, notes will be in response.data
      const notesData = response.data || response;
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast.error('فشل تحميل المذكرات التعليمية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      const matchSearch =
        !normalizedSearch ||
        note.title.toLowerCase().includes(normalizedSearch) ||
        (note.description || '').toLowerCase().includes(normalizedSearch);

      const matchGrade = !selectedGradeId || note.grade_id === selectedGradeId;
      const matchTeacher = !selectedTeacherId || note.teacher_id === selectedTeacherId;

      return matchSearch && matchGrade && matchTeacher;
    });
  }, [notes, searchQuery, selectedGradeId, selectedTeacherId]);

  const gradeOptions = useMemo(() => {
    const map = new Map<string, string>();
    notes.forEach((note) => {
      if (note.grade) {
        map.set(note.grade_id, note.grade.name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [notes]);

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    notes.forEach((note) => {
      if (note.teacher) {
        map.set(note.teacher_id, note.teacher.name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [notes]);

  const stats = useMemo(() => {
    return {
      total: notes.length,
      teachers: new Set(notes.map(n => n.teacher_id)).size,
      grades: new Set(notes.map(n => n.grade_id)).size,
    };
  }, [notes]);

  const handleViewNote = async (note: Note) => {
    if (!note.attachments || note.attachments.length === 0) {
      toast.error('هذه المذكرة لا تحتوي على ملفات');
      return;
    }

    try {
      setSelectedNoteForView(note);
      const attachment = note.attachments[0];
      const response = await noteService.getAttachmentUrl(note.id, attachment.id);
      setPdfUrl(response.url);
      setIsViewerOpen(true);
    } catch (error) {
      console.error('Failed to get note URL:', error);
      toast.error('فشل تحميل ملف المذكرة');
    }
  };

  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      setIsProcessing(true);
      await noteService.deleteNote('academy', noteToDelete.id);
      toast.success('تم حذف المذكرة بنجاح');
      await fetchNotes();
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('فشل حذف المذكرة');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c1b]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-light/60 mt-4 animate-pulse">جاري تحميل المذكرات...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      role="academy"
      user={{ name: user?.name || 'الأكاديمية', avatar: user?.avatar || '' }}
    >
      <div className="space-y-8 pb-12 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="relative p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-right">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl md:text-4xl shadow-2xl">
                <Icon name="file-pdf" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">إدارة مذكرات الأكاديمية</h1>
                <p className="text-gray-light/60 text-sm md:text-lg font-medium mt-2">استعرض وقم بإدارة المذكرات التعليمية المرفوعة من قبل المدرسين.</p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/academy/notes/create')} 
              variant="primary" 
              className="h-14 md:h-16 px-8 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-r from-primary to-secondary hover:shadow-[0_10px_30px_rgba(66,99,235,0.4)] text-white font-black uppercase tracking-widest border-none gap-3 transition-all w-full lg:w-auto"
            >
              <Icon name="plus" />
              <span>إضافة مذكرة جديدة</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <StatCard title="إجمالي المذكرات" value={stats.total} icon="file-pdf" color="primary" variant="premium" />
          <StatCard title="عدد المدرسين" value={stats.teachers} icon="users" color="success" variant="premium" />
          <StatCard title="عدد الصفوف" value={stats.grades} icon="graduation-cap" color="warning" variant="premium" />
        </div>

        {/* Filters Section */}
        <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 relative">
              <Icon name="search" className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40" />
              <Input
                type="text"
                placeholder="ابحث بالعنوان أو الوصف..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-14 rounded-2xl pr-14 pl-6 text-white text-lg placeholder:text-gray-light/20"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64">
                <Filter
                  options={[
                    { value: '', label: 'كل المدرسين' },
                    ...teacherOptions,
                  ]}
                  value={selectedTeacherId}
                  onChange={setSelectedTeacherId}
                  placeholder="تصفية حسب المدرس"
                  className="w-full h-14"
                />
              </div>
              <div className="w-full md:w-64">
                <Filter
                  options={[
                    { value: '', label: 'كل الصفوف الدراسية' },
                    ...gradeOptions,
                  ]}
                  value={selectedGradeId}
                  onChange={setSelectedGradeId}
                  placeholder="تصفية حسب الصف"
                  className="w-full h-14"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => <NoteCardSkeleton key={item} />)}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-24 rounded-[3rem] premium-glass premium-border relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Icon name="file-pdf" className="text-5xl text-primary/20" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">لا توجد مذكرات</h3>
              <p className="text-gray-light/40 font-medium mb-8">لم نتمكن من العثور على أي مذكرات حالياً.</p>
              <Button 
                onClick={() => router.push('/academy/notes/create')} 
                variant="primary"
                className="px-8 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest"
              >
                <Icon name="plus" />
                <span>إضافة أول مذكرة</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredNotes.map((note) => (
              <div key={note.id} className="relative group">
                <NoteCard
                  note={note}
                  onView={handleViewNote}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(note);
                  }}
                  className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-red-500 hover:text-white z-20"
                  title="حذف المذكرة"
                >
                  <Icon name="trash" size="sm" />
                </button>
              </div>
            ))}
          </div>
        )}

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="تأكيد حذف المذكرة"
          message={`أنت على وشك حذف مذكرة "${noteToDelete?.title || ''}" بشكل نهائي. هل أنت متأكد؟`}
          confirmText="نعم، احذف المذكرة"
          cancelText="تراجع"
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setNoteToDelete(null);
          }}
          isProcessing={isProcessing}
          variant="danger"
        />

        <NoteViewerModal
          open={isViewerOpen}
          note={selectedNoteForView}
          pdfUrl={pdfUrl}
          onClose={() => {
            setIsViewerOpen(false);
            setPdfUrl('');
          }}
        />
      </div>
    </DashboardLayout>
  );
}
