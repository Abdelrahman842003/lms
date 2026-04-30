'use client';

import React, { useMemo, useState } from 'react';
import { Filter } from '@/components/Filter';
import { Button, FilePicker, Icon, Input, Textarea } from '@/components/ui';
import { useVideoUploadContext } from '@/contexts/VideoUploadContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';

import type { VideoItem } from '@/types/video.types';

interface OptionItem {
  id: string;
  name: string;
  grade_id?: string;
}

interface VideoUploadFormProps {
  mode: 'teacher' | 'academy';
  grades: OptionItem[];
  groups: OptionItem[];
  teachers?: OptionItem[];
  onCreated: (video: VideoItem) => void;
}

// Human-readable phase labels (Arabic)
const PHASE_LABELS: Record<string, string> = {
  preparing:  'جاري تجهيز الرفع...',
  uploading:  'جاري رفع الفيديو...',
  retrying:   'إعادة المحاولة...',
  completing: 'جاري إكمال الرفع...',
  completed:  'تم الرفع بنجاح ✓',
  failed:     'فشل الرفع',
  aborted:    'تم إلغاء الرفع',
};

export function VideoUploadForm({
  mode,
  grades,
  groups,
  teachers = [],
  onCreated,
}: VideoUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [teacherReferenceId, setTeacherReferenceId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { state: uploadState, startUpload, cancelUpload, reset } = useVideoUploadContext();

  // Watch for completion to reset form and notify parent
  React.useEffect(() => {
    if (uploadState.phase === 'completed' && uploadState.videoId) {
      onCreated({ id: uploadState.videoId } as VideoItem);
      resetForm();
    }
  }, [uploadState.phase, uploadState.videoId, onCreated]);


  const isUploading =
    uploadState.phase === 'preparing' ||
    uploadState.phase === 'uploading' ||
    uploadState.phase === 'retrying' ||
    uploadState.phase === 'completing';


  const filteredGroups = useMemo(() => {
    if (!gradeId) return [];
    return groups.filter((group) => !group.grade_id || String(group.grade_id) === String(gradeId));
  }, [gradeId, groups]);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === teacherReferenceId),
    [teacherReferenceId, teachers]
  );

  const toggleGroup = (groupId: string) => {
    setGroupIds((previous) => {
      if (previous.includes(groupId)) return previous.filter((id) => id !== groupId);
      return [...previous, groupId];
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGradeId('');
    setGroupIds([]);
    setTeacherReferenceId('');
    setScheduledAt('');
    setVideoFile(null);
    setAttachments([]);
    setFormError(null);
    reset();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!videoFile) {
      setFormError('يجب اختيار ملف الفيديو.');
      return;
    }

    if (!title.trim() || !gradeId) {
      setFormError('يجب إدخال العنوان واختيار الصف الدراسي.');
      return;
    }

    if (mode === 'academy' && !teacherReferenceId.trim()) {
      setFormError('يجب اختيار المدرس المرجعي.');
      return;
    }

    setFormError(null);
    reset();

    await startUpload(videoFile, {
      title: title.trim(),
      description: description.trim() || undefined,
      grade_id: gradeId,
      group_ids: groupIds,
      scheduled_at: scheduledAt || undefined,
      teacher_reference_id: mode === 'academy' ? teacherReferenceId : undefined,
      teacher_reference_name: mode === 'academy' ? selectedTeacher?.name : undefined,
    }, mode, attachments);

  };

  const handleCancel = () => {
    if (isUploading) {
      cancelUpload('cancelled by user');
    } else {
      window.history.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
      <div className="space-y-6">
        {mode === 'academy' && (
          <div className="form-group">
            <label className="block text-white mb-2">المدرس</label>
            {teachers.length > 0 ? (
              <Filter
                options={teachers.map((teacher) => ({ value: teacher.id, label: teacher.name }))}
                value={teacherReferenceId}
                onChange={setTeacherReferenceId}
                placeholder="اختر المدرس"
                className="w-full"
              />
            ) : (
              <Input
                value={teacherReferenceId}
                onChange={(event) => setTeacherReferenceId(event.target.value)}
                placeholder="Teacher Reference ID"
                className="w-full"
              />
            )}
          </div>
        )}

        <Input
          label="عنوان الفيديو"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثال: مراجعة الفصل الأول"
          required
          className="w-full"
        />

        <div className="form-group">
          <label className="block text-white mb-2">الصف الدراسي</label>
          <Filter
            options={grades.map((grade) => ({ value: grade.id, label: grade.name }))}
            value={gradeId}
            onChange={(value) => {
              setGradeId(value);
              setGroupIds([]);
            }}
            placeholder="اختر الصف"
            className="w-full"
          />
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-white">المجموعات (متعدد - اختياري)</label>
            <span className="text-xs text-gray-400">{groupIds.length} محددة</span>
          </div>

          {!gradeId ? (
            <p className="text-sm text-gray-400">اختر الصف أولًا لعرض المجموعات المتاحة.</p>
          ) : filteredGroups.length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد مجموعات متاحة لهذا الصف. سيتم تطبيق الفيديو على الصف بالكامل.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {filteredGroups.map((group) => {
                  const selected = groupIds.includes(group.id);
                  return (
                    <Button
                      key={group.id}
                      type="button"
                      variant={selected ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => toggleGroup(group.id)}
                    >
                      {selected && <Icon name="check" size="xs" />}
                      <span>{group.name}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                لو لم تختَر أي مجموعة، سيتم نشر الفيديو على كل طلاب الصف المختار.
              </p>
            </>
          )}
        </div>

        <Textarea
          label="الوصف (اختياري)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="وصف مختصر للفيديو..."
          rows={4}
          className="w-full"
        />

        <Input
          label="وقت النشر المجدول (اختياري)"
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          disabled={isUploading}
          className="w-full"
        />

        <FilePicker
          label="ملف الفيديو"
          accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
          files={videoFile ? [videoFile] : []}
          onFilesChange={(files) => setVideoFile(files[0] || null)}
          buttonText="اختيار فيديو"
          emptyText="لم يتم اختيار ملف فيديو بعد"
          helperText="الصيغ المدعومة: MP4 / MOV / MKV / WEBM"
          disabled={isUploading}
        />

        <FilePicker
          label="المرفقات (PDF/Image)"
          accept="application/pdf,image/*"
          multiple
          files={attachments}
          onFilesChange={setAttachments}
          buttonText="اختيار مرفقات"
          emptyText="لا توجد مرفقات مضافة"
          helperText="اختياري: يمكنك إضافة أكثر من ملف."
          disabled={isUploading}
        />
      </div>

      {/* ── Upload progress ── */}
      {isUploading && (
        <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-5 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">{PHASE_LABELS[uploadState.phase] ?? 'جاري الرفع...'}</p>
            <span className="text-lg font-bold text-primary tabular-nums">{uploadState.progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-200"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>

          {/* Part counter */}
          {uploadState.totalParts > 1 && (
            <p className="text-xs text-gray-400 text-start">
              الجزء <span className="text-white font-semibold">{uploadState.currentPart}</span> من{' '}
              <span className="text-white font-semibold">{uploadState.totalParts}</span>
            </p>
          )}

          {/* Cancel button */}
          <div className="text-end pt-1">
            <Button type="button" variant="destructive" size="sm" onClick={() => cancelUpload(mode, 'cancelled by user')}>
              إلغاء الرفع
            </Button>
          </div>
        </div>
      )}

      {/* ── Completion ── */}
      {uploadState.phase === 'completed' && (
        <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="text-sm text-green-300">تم رفع الفيديو بنجاح! جاري معالجته...</p>
        </div>
      )}

      {/* ── Errors ── */}
      {(formError || uploadState.error) && (
        <p className="mt-4 text-sm text-red-300">{formError ?? uploadState.error}</p>
      )}

      {uploadState.phase === 'aborted' && !uploadState.error && (
        <p className="mt-4 text-sm text-yellow-400">تم إلغاء الرفع. يمكنك البدء من جديد.</p>
      )}

      <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
          disabled={uploadState.phase === 'completing'}
        >
          {isUploading ? 'إلغاء الرفع' : 'إلغاء'}
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          loading={isUploading}
          disabled={isUploading || uploadState.phase === 'completed'}
        >
          <Icon name="upload" />
          <span>رفع الفيديو</span>
        </Button>
      </div>
    </form>
  );
}

