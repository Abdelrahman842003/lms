'use client';

import React, { useMemo, useState } from 'react';
import { Filter } from '@/components/Filter';
import { Button, FilePicker, Icon, Input, Textarea } from '@/components/ui';
import { uploadAcademyVideo, uploadTeacherVideo } from '@/services/videoService';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [cancelUpload, setCancelUpload] = useState<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (previous.includes(groupId)) {
        return previous.filter((id) => id !== groupId);
      }

      return [...previous, groupId];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!videoFile) {
      setError('يجب اختيار ملف الفيديو.');
      return;
    }

    if (!title.trim() || !gradeId) {
      setError('يجب إدخال العنوان واختيار الصف الدراسي.');
      return;
    }

    if (mode === 'academy' && !teacherReferenceId.trim()) {
      setError('يجب اختيار المدرس المرجعي.');
      return;
    }

    setError(null);
    setUploading(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      grade_id: gradeId,
      group_ids: groupIds,
      scheduled_at: scheduledAt || undefined,
      teacher_reference_id: mode === 'academy' ? teacherReferenceId : undefined,
      teacher_reference_name: mode === 'academy' ? selectedTeacher?.name : undefined,
      video_file: videoFile,
      attachments,
    };

    const uploader =
      mode === 'teacher'
        ? uploadTeacherVideo(payload, setUploadProgress)
        : uploadAcademyVideo(payload, setUploadProgress);

    setCancelUpload(() => uploader.cancel);

    try {
      const createdVideo = await uploader.promise;
      onCreated(createdVideo);

      setTitle('');
      setDescription('');
      setGradeId('');
      setGroupIds([]);
      setTeacherReferenceId('');
      setScheduledAt('');
      setVideoFile(null);
      setAttachments([]);
      setUploadProgress(0);
    } catch (uploadError: unknown) {
      if (uploadError instanceof Error && uploadError.message) {
        setError(uploadError.message);
      } else {
        setError('فشل رفع الفيديو.');
      }
    } finally {
      setUploading(false);
      setCancelUpload(null);
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
          disabled={uploading}
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
          disabled={uploading}
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
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white">جاري رفع الفيديو...</p>
            <p className="text-sm text-primary">{uploadProgress}%</p>
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>

          {cancelUpload && (
            <div className="mt-3 text-end">
              <Button type="button" variant="destructive" size="sm" onClick={cancelUpload}>
                إلغاء الرفع
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => window.history.back()}
          disabled={uploading}
        >
          إلغاء
        </Button>
        <Button type="submit" variant="primary" className="flex-1" loading={uploading}>
          <Icon name="upload" />
          <span>رفع الفيديو</span>
        </Button>
      </div>
    </form>
  );
}
