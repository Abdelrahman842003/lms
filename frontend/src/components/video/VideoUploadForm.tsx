'use client';

import React, { useMemo, useState } from 'react';
import { Filter } from '@/components/Filter';
import { Button, FilePicker, Icon, Input, Textarea } from '@/components/ui';
import { useVideoUploadContext } from '@/contexts/VideoUploadContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { cn } from '@/utils';

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
  draft:       'مسودة',
  initiating:  'جاري التجهيز...',
  uploading:   'جاري الرفع...',
  paused:      'تم الإيقاف مؤقتاً',
  interrupted: 'منقطع - يرجى الاستكمال',
  retrying:    'إعادة المحاولة...',
  completing:  'جاري الإكمال...',
  completed:   'اكتمل الرفع ✓',
  failed:      'فشل الرفع',
  aborted:     'ملغى',
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

  const { state: uploadState, startUpload, cancelUpload, reset, pauseUpload } = useVideoUploadContext();

  // Watch for completion to reset form and notify parent
  React.useEffect(() => {
    if (uploadState.phase === 'completed' && uploadState.videoId) {
      onCreated({ id: uploadState.videoId } as VideoItem);
      resetForm();
    }
  }, [uploadState.phase, uploadState.videoId, onCreated]);


  const isUploading =
    uploadState.phase === 'initiating' ||
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
      setFormError('يجب اختيار ملف الفيديو أولاً.');
      return;
    }

    if (!title.trim() || !gradeId) {
      setFormError('يرجى ملء البيانات الأساسية (العنوان والصف الدراسي).');
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
      cancelUpload(mode, 'cancelled by user');
    } else {
      window.history.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Video & Files */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Content Section */}
          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="info-circle" className="text-primary" />
              <h3 className="text-lg md:text-xl font-bold text-white">بيانات الفيديو</h3>
            </div>

            <div className="form-group">
              <label htmlFor="title" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">عنوان الفيديو</label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثال: شرح مبسط للجزء الأول"
                required
                className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl px-5 md:px-6 text-base md:text-lg"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">وصف الفيديو (اختياري)</label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="اكتب تفاصيل المحتوى التعليمي..."
                rows={4}
                className="w-full bg-white/5 border-white/10 focus:border-primary/50 rounded-xl md:rounded-2xl p-5 md:p-6 min-h-[100px] md:min-h-[120px] text-sm md:text-base"
              />
            </div>
          </div>

          {/* Upload Section */}
          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="cloud-upload-alt" className="text-secondary" />
              <h3 className="text-lg md:text-xl font-bold text-white">ملفات الميديا</h3>
            </div>

            <div className="space-y-6">
              <div className="form-group">
                <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-4 mr-1">ملف الفيديو الرئيسي</label>
                <FilePicker
                  accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
                  files={videoFile ? [videoFile] : []}
                  onFilesChange={(files) => setVideoFile(files[0] || null)}
                  buttonText="اختيار ملف الفيديو"
                  emptyText="اسحب الملف هنا أو اضغط للاختيار"
                  helperText="MP4 / MOV / MKV / WEBM"
                  disabled={isUploading}
                />
              </div>

              <div className="form-group">
                <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-4 mr-1">المرفقات الإضافية (PDF/Images)</label>
                <FilePicker
                  accept="application/pdf,image/*"
                  multiple
                  files={attachments}
                  onFilesChange={setAttachments}
                  buttonText="إضافة مرفقات"
                  emptyText="يمكنك إضافة ملازم أو صور توضيحية"
                  helperText="اختياري: ملفات PDF أو صور"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Submit */}
        <div className="space-y-8">
          {/* Settings Section */}
          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="cog" className="text-warning" />
              <h3 className="text-lg md:text-xl font-bold text-white">إعدادات النشر</h3>
            </div>

            {mode === 'academy' && (
              <div className="form-group">
                <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-3 mr-1">المدرس المرجعي</label>
                <Filter
                  options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                  value={teacherReferenceId}
                  onChange={setTeacherReferenceId}
                  placeholder="اختر المدرس"
                  className="w-full"
                />
              </div>
            )}

            <div className="form-group">
              <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-3 mr-1">الصف الدراسي</label>
              <Filter
                options={grades.map((g) => ({ value: g.id, label: g.name }))}
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
              <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-3 mr-1">المجموعات المحددة</label>
              {!gradeId ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-light/40 text-center">
                  اختر الصف الدراسي أولاً
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-light/40 text-center">
                  لا توجد مجموعات لهذا الصف
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredGroups.map((group) => {
                    const selected = groupIds.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                          selected 
                            ? "bg-primary text-white border-primary shadow-lg" 
                            : "bg-white/5 border-white/10 text-gray-light/60 hover:border-white/30"
                        )}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="scheduled" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-3 mr-1">موقت النشر (اختياري)</label>
              <div className="relative">
                <Icon name="clock" className="absolute right-5 top-1/2 -translate-y-1/2 text-primary" />
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  disabled={isUploading}
                  className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl pr-12 pl-5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Status & Action Block */}
          <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
            
            {/* Progress Visualization */}
            {isUploading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">
                      {PHASE_LABELS[uploadState.phase] ?? 'جاري الرفع...'}
                    </span>
                    <span className="text-xs text-gray-light/60">
                      {(uploadState.uploadedBytes / 1024 / 1024).toFixed(1)} MB من {(uploadState.totalBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <span className="text-3xl font-black text-white tabular-nums">{uploadState.progress}%</span>
                </div>
                
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(66,99,235,0.5)]",
                      uploadState.phase === 'paused' ? 'bg-orange-500' : 'bg-primary'
                    )}
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={pauseUpload} className="flex-1 text-[10px] h-9 rounded-lg">
                    {uploadState.phase === 'paused' ? 'استئناف' : 'إيقاف مؤقت'}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => cancelUpload(mode, 'cancelled by user')} className="flex-1 text-[10px] h-9 rounded-lg">
                    إلغاء تماماً
                  </Button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {(formError || uploadState.error) && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-in shake duration-500">
                <Icon name="exclamation-triangle" className="text-red-500 mt-1" size="sm" />
                <span className="text-xs text-red-400 leading-tight">{formError ?? uploadState.error}</span>
              </div>
            )}

            {/* Main Action Button */}
            <Button
              type="submit"
              disabled={isUploading || uploadState.phase === 'completed'}
              className={cn(
                "w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest border-none gap-3 transition-all text-sm md:text-base",
                uploadState.phase === 'completed' 
                  ? "bg-success/20 text-success" 
                  : "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_10px_30px_rgba(66,99,235,0.4)]"
              )}
            >
              {uploadState.phase === 'completed' ? (
                <>
                  <Icon name="check-circle" />
                  <span>اكتمل الرفع بنجاح</span>
                </>
              ) : (
                <>
                  <Icon name="cloud-upload-alt" />
                  <span>بدء عملية الرفع الآن</span>
                </>
              )}
            </Button>
            
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="w-full h-12 rounded-[1.5rem] text-gray-light hover:text-white transition-all text-xs"
              >
                إلغاء والرجوع
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
