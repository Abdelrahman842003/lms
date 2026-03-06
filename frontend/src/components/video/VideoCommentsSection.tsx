'use client';

import React, { useMemo, useState } from 'react';
import { addVideoComment, deleteOwnComment } from '@/services/videoService';
import type { VideoComment } from '@/types/video.types';
import { Button, Textarea } from '@/components/ui';

interface VideoCommentsSectionProps {
  videoId: string;
  comments: VideoComment[];
  canDeleteOwn: boolean;
  currentUserId?: string;
  onRefresh: () => Promise<void>;
}

export function VideoCommentsSection({
  videoId,
  comments,
  canDeleteOwn,
  currentUserId,
  onRefresh,
}: VideoCommentsSectionProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const rootComments = useMemo(() => comments.filter((comment) => !comment.parent_id), [comments]);

  const handleAdd = async () => {
    if (!body.trim()) return;
    setLoading(true);

    try {
      await addVideoComment(videoId, body.trim());
      setBody('');
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!canDeleteOwn) return;
    await deleteOwnComment(videoId, commentId);
    await onRefresh();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#1e1e2d] p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">التعليقات</h3>

      <div className="mb-4">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="اكتب تعليقك..."
          rows={3}
          className="w-full"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={handleAdd} loading={loading}>إرسال تعليق</Button>
        </div>
      </div>

      <div className="space-y-3">
        {rootComments.map((comment) => (
          <div key={comment.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-1 flex items-center justify-between text-sm text-gray-300">
              <span>{comment.author.name || 'مستخدم'}</span>
              <span>{new Date(comment.created_at).toLocaleString('ar-EG')}</span>
            </div>
            <p className="text-white">{comment.body}</p>

            {canDeleteOwn && currentUserId && comment.author.id === currentUserId && (
              <div className="mt-2 text-end">
                <button
                  type="button"
                  className="text-xs text-red-300 hover:text-red-200"
                  onClick={() => void handleDelete(comment.id)}
                >
                  حذف
                </button>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-2 border-s border-white/10 ps-3">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="rounded-md bg-black/20 p-2">
                    <p className="text-xs text-gray-300">{reply.author.name || 'مستخدم'}</p>
                    <p className="text-sm text-white">{reply.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
