'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Icon } from '@/components/ui';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { noteService, Note } from '@/services/noteService';
import { NoteCard, NoteCardSkeleton } from '@/components/notes/NoteCard';
import { NoteViewerModal } from '@/components/notes/NoteViewerModal';
import { toast } from 'react-hot-toast';

export default function StudentNotesPage() {
  const { user } = useCoreAuth();
  const { selectedTeacher } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isGettingUrl, setIsGettingUrl] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      try {
        const response = await noteService.getStudentNotes();
        const notesData = response.data || response;
        setNotes(Array.isArray(notesData) ? notesData : []);
      } catch (error) {
        console.error('Failed to load notes:', error);
        toast.error('فشل في تحميل المذكرات');
      } finally {
        setLoading(false);
      }
    };

    void loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    if (!selectedTeacher) return notes;
    const teacherId = selectedTeacher.teacher_id || (selectedTeacher as any).id;
    return notes.filter(note => note.teacher_id === teacherId);
  }, [notes, selectedTeacher]);

  const handleViewNote = async (note: Note) => {
    if (!note.attachments || note.attachments.length === 0) {
      toast.error('لا توجد ملفات مرفقة لهذه المذكرة');
      return;
    }

    // For now, if there are multiple files, we'll open the first one.
    const attachment = note.attachments[0];
    
    setIsGettingUrl(true);
    try {
      const { url } = await noteService.getAttachmentUrl(note.id, attachment.id);
      setSelectedNote(note);
      setPdfUrl(url);
      setViewerOpen(true);
    } catch (error) {
      console.error('Failed to get attachment URL:', error);
      toast.error('فشل في فتح الملف');
    } finally {
      setIsGettingUrl(false);
    }
  };

  return (
    <DashboardLayout role="student" user={user || undefined}>
      {/* Page Header */}
      <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-4xl shadow-2xl premium-border">
              <Icon name="file-pdf" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">مذكراتي</h2>
              <p className="text-gray-light/60 text-lg font-medium">تصفح وحمل المذكرات التعليمية الخاصة بصفوفك</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">المعلم الحالي</span>
                <span className="text-xl font-black text-white">{selectedTeacher?.teacher_name || (selectedTeacher as any)?.name || 'جميع المعلمين'}</span>
             </div>
             <div className="w-px h-10 bg-white/10 hidden md:block" />
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">إجمالي المذكرات</span>
                <span className="text-xl font-black text-white">{filteredNotes.length} مذكرة</span>
             </div>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotes.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onView={handleViewNote} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 rounded-[3rem] premium-glass premium-border text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-gray-light/20 text-5xl mb-6">
            <Icon name="file-alt" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">لا يوجد مذكرات حالياً</h3>
          <p className="text-gray-light/50 max-w-md">سيقوم معلموك برفع المذكرات التعليمية هنا فور توفرها.</p>
        </div>
      )}

      {/* Note Viewer Modal */}
      <NoteViewerModal
        open={viewerOpen}
        note={selectedNote}
        pdfUrl={pdfUrl}
        onClose={() => setViewerOpen(false)}
      />

      {/* Global Loading Overlay for URL generation */}
      {isGettingUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-[#0d1120] p-8 rounded-[2rem] premium-border">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-white font-black">جاري تجهيز المذكرة...</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
