'use client';

import React from 'react';
import { Icon } from '@/components/ui';
import { Note } from '@/services/noteService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

export function NoteCard({ note, onView, onDelete }: NoteCardProps) {
  return (
    <div className="group relative p-6 rounded-[2rem] premium-glass premium-border hover:border-primary/50 transition-all duration-500 overflow-hidden h-full flex flex-col">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-colors duration-500"></div>
      
      <div className="relative flex flex-col h-full gap-5">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl premium-border">
              <Icon name="file-pdf" size="lg" />
            </div>
            
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 transition-all duration-300 flex items-center justify-center hover:bg-red-500 hover:text-white"
                title="حذف المذكرة"
              >
                <Icon name="trash" size="sm" />
              </button>
            )}
          </div>

          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-light/40 uppercase tracking-wider">
            {format(new Date(note.created_at), 'dd MMMM yyyy', { locale: ar })}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors line-clamp-1">
            {note.title || 'مذكرة بدون عنوان'}
          </h3>
          <p className="text-sm text-gray-light/50 font-medium line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {note.description || 'لا يوجد وصف متاح لهذه المذكرة.'}
          </p>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-light/30 uppercase tracking-widest mb-0.5 text-right">المعلم</span>
            <span className="text-xs font-black text-white/80">{note.teacher?.name || 'غير محدد'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-light/30 uppercase tracking-widest mb-0.5 text-left">الصف</span>
            <span className="text-xs font-black text-white/80">{note.grade?.name || 'غير محدد'}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onView(note)}
          className="mt-1 w-full py-4 rounded-2xl bg-white/5 hover:bg-primary text-white text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 group/btn border border-white/10 hover:border-primary shadow-lg"
        >
          <span>عرض المذكرة</span>
          <Icon name="arrow-left" className="group-hover/btn:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 animate-pulse h-full flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl bg-white/10"></div>
        <div className="w-24 h-6 rounded-full bg-white/10"></div>
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-6 w-3/4 rounded-lg bg-white/10"></div>
        <div className="h-10 w-full rounded-lg bg-white/10"></div>
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between">
        <div className="h-8 w-20 rounded bg-white/10"></div>
        <div className="h-8 w-20 rounded bg-white/10"></div>
      </div>
      <div className="mt-1 h-14 w-full rounded-2xl bg-white/10"></div>
    </div>
  );
}
