'use client';

import React, { useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { WatermarkedPdfViewer } from '@/components/shared/WatermarkedPdfViewer';
import { Note } from '@/services/noteService';

export interface NoteViewerModalProps {
  open: boolean;
  note: Note | null;
  pdfUrl: string;
  onClose: () => void;
}

export function NoteViewerModal({
  open,
  note,
  pdfUrl,
  onClose,
}: NoteViewerModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !note) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-[#0d1120]/95 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
            <Icon name="file-pdf" className="text-primary" size="sm" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-black truncate">{note.title}</span>
            <span className="text-gray-light/40 text-[10px] font-bold uppercase tracking-widest">عرض المذكرة التعليمية</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95"
          aria-label="إغلاق"
        >
          <Icon name="times" size="sm" />
        </button>
      </div>

      {/* ── Viewer area ── */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full bg-[#0d1120]/80">
          <WatermarkedPdfViewer url={pdfUrl} fileName={note.title + '.pdf'} />
        </div>
      </div>
    </div>
  );
}
