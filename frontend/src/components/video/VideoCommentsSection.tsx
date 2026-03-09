'use client';

import React, { useMemo, useState } from 'react';
import { addVideoComment, deleteOwnComment } from '@/services/videoService';
import type { VideoComment } from '@/types/video.types';
import { Textarea } from '@/components/ui';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Icon } from '@/components/ui/Icon';

interface VideoCommentsSectionProps {
  videoId: string;
  comments: VideoComment[];
  canDeleteOwn: boolean;
  currentUserId?: string;
  onRefresh: () => Promise<void>;
}

// ─── Single comment ───────────────────────────────────────────────────────────
function CommentBubble({
  comment,
  isOwn,
  onDeleteRequest,
}: {
  comment: VideoComment;
  isOwn: boolean;
  onDeleteRequest: (id: string) => void;
}) {
  const date = new Date(comment.created_at).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const time = new Date(comment.created_at).toLocaleTimeString('ar-EG', {
    hour: '2-digit', minute: '2-digit',
  });
  const initials = (comment.author.name || 'م').slice(0, 2);

  return (
    <div className={`group flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold select-none
        ${isOwn
          ? 'bg-primary/20 border border-primary/30 text-primary'
          : 'bg-white/10 border border-white/10 text-gray-300'}`}>
        {initials}
      </div>

      {/* Bubble */}
      <div className={`flex-1 max-w-[85%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 text-xs ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={isOwn ? 'text-primary font-semibold' : 'text-gray-400 font-medium'}>
            {isOwn ? 'أنت' : (comment.author.name || 'مستخدم')}
          </span>
          <span className="text-gray-600">{date} · {time}</span>
        </div>

        {/* Message */}
        <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed break-words
          ${isOwn
            ? 'bg-primary/15 border border-primary/20 text-white rounded-tr-sm'
            : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'}`}>
          {comment.body}

          {/* Delete button — appears on hover, only for own comments */}
          {isOwn && (
            <button
              type="button"
              onClick={() => onDeleteRequest(comment.id)}
              className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20
                         text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100
                         hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-200"
              title="حذف"
            >
              <Icon name="trash" className="text-red-400" size="sm" />
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 space-y-1.5 border-s-2 border-white/10 ps-3 w-full">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-white/8 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                  {(reply.author.name || 'م').slice(0, 1)}
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">{reply.author.name || 'مستخدم'}</p>
                  <p className="text-xs text-gray-200 leading-relaxed">{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function VideoCommentsSection({
  videoId,
  comments,
  canDeleteOwn,
  currentUserId,
  onRefresh,
}: VideoCommentsSectionProps) {
  const [body, setBody]             = useState('');
  const [sending, setSending]       = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const rootComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments],
  );

  // ── Send ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await addVideoComment(videoId, body.trim());
      setBody('');
      await onRefresh();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void handleAdd();
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId || !canDeleteOwn) return;
    setDeleting(true);
    try {
      await deleteOwnComment(videoId, deleteId);
      await onRefresh();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteId !== null}
        title="حذف التعليق"
        message={
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Icon name="trash" className="text-red-400 text-xl" />
            </div>
            <p className="text-gray-300 text-sm">هل أنت متأكد من حذف هذا التعليق؟</p>
            <p className="text-gray-500 text-xs">لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
        }
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        variant="danger"
        isProcessing={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
      />

      {/* Comments panel */}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Icon name="comments" className="text-primary" size="sm" />
            التعليقات
          </h3>
          {rootComments.length > 0 && (
            <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {rootComments.length} تعليق
            </span>
          )}
        </div>

        {/* Compose box */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1120]/60 backdrop-blur-sm p-4 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب تعليقك… (Ctrl+Enter للإرسال)"
            rows={3}
            className="w-full bg-transparent resize-none text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 text-xs">
              {body.length > 0 && `${body.length} حرف`}
            </span>
            <button
              type="button"
              disabled={sending || !body.trim()}
              onClick={() => void handleAdd()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/80
                         disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold
                         transition-all shadow-[0_0_20px_rgba(66,99,235,0.3)] hover:shadow-[0_0_28px_rgba(66,99,235,0.5)]"
            >
              {sending
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> إرسال…</>
                : <><Icon name="paper-plane" size="sm" /> إرسال</>
              }
            </button>
          </div>
        </div>

        {/* Comments list */}
        {rootComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon name="comments" className="text-gray-600 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm">لا توجد تعليقات بعد</p>
            <p className="text-gray-700 text-xs">كن أول من يعلّق!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            {rootComments.map((comment) => {
              const isOwn = !!(currentUserId && comment.author.id === currentUserId);
              return (
                <CommentBubble
                  key={comment.id}
                  comment={comment}
                  isOwn={isOwn && canDeleteOwn}
                  onDeleteRequest={(id) => setDeleteId(id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
