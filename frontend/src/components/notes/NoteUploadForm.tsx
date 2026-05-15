'use client';

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Filter } from '@/components/Filter';
import { Button, FilePicker, Icon, Input, LoadingSpinner, Textarea } from '@/components/ui';
import { noteService } from '@/services/noteService';
import { cn } from '@/utils';

interface OptionItem {
  id: string;
  name: string;
  grade_id?: string;
}

interface NoteUploadFormProps {
  mode: 'teacher' | 'academy';
  grades: OptionItem[];
  groups: OptionItem[];
  teachers?: OptionItem[];
  onCreated: () => void;
}

export function NoteUploadForm({
  mode,
  grades,
  groups,
  teachers = [],
  onCreated,
}: NoteUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    if (!gradeId) return [];
    return groups.filter((group) => !group.grade_id || String(group.grade_id) === String(gradeId));
  }, [gradeId, groups]);

  const toggleGroup = (groupId: string) => {
    setGroupIds((previous) => {
      if (previous.includes(groupId)) return previous.filter((id) => id !== groupId);
      return [...previous, groupId];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (files.length === 0) {
      setFormError('يجب اختيار ملف PDF واحد على الأقل.');
      return;
    }

    if (files.length > 2) {
      setFormError('يمكنك رفع ملفين كحد أقصى للمذكرة الواحدة.');
      return;
    }

    if (!title.trim() || !gradeId) {
      setFormError('يرجى ملء البيانات الأساسية (العنوان والصف الدراسي).');
      return;
    }

    if (mode === 'academy' && !teacherId) {
      setFormError('يجب اختيار المدرس.');
      return;
    }

    setFormError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Initiate Note
      const initiateData = {
        title: title.trim(),
        description: description.trim() || undefined,
        grade_id: gradeId,
        teacher_id: mode === 'academy' ? teacherId : undefined,
        files: files.map(f => ({ 
          name: f.name, 
          mime: f.type,
          size: f.size 
        })),
      };

      const { note_id, upload_urls } = await noteService.initiateNote(mode, initiateData);

      // 2. Upload files to R2 via presigned URLs
      const attachmentResults = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadInfo = upload_urls.find((u: any) => u.name === file.name);

        if (!uploadInfo) continue;

        const response = await fetch(uploadInfo.put_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/pdf',
            'Content-Disposition': 'inline',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`فشل رفع ملف ${file.name} (Status: ${response.status})`);
        }

        attachmentResults.push({
          name: file.name,
          file_path: uploadInfo.path,
          mime_type: file.type,
          file_size: file.size,
        });

        // Update progress manually since fetch doesn't have onUploadProgress out of the box easily
        // for simple implementation we just set it to 100% for each file as it completes
        setUploadProgress(Math.round(((i + 1) * 100) / files.length));
      }

      // 3. Complete Note
      await noteService.completeNote(mode, note_id, {
        group_ids: groupIds,
        attachments: attachmentResults,
      });

      toast.success('تم رفع المذكرة بنجاح');
      onCreated();
    } catch (error: any) {
      console.error('Upload failed:', error);
      const message = error.message || 'فشل عملية الرفع، يرجى المحاولة مرة أخرى.';
      setFormError(message);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Files */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="info-circle" className="text-primary" />
              <h3 className="text-lg md:text-xl font-bold text-white">بيانات المذكرة</h3>
            </div>

            <div className="form-group">
              <label htmlFor="title" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">عنوان المذكرة</label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثال: مذكرة الكيمياء العضوية - الجزء الأول"
                required
                disabled={isUploading}
                className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl px-5 md:px-6 text-base md:text-lg"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">وصف المذكرة (اختياري)</label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="اكتب تفاصيل إضافية عن محتوى المذكرة..."
                rows={4}
                disabled={isUploading}
                className="w-full bg-white/5 border-white/10 focus:border-primary/50 rounded-xl md:rounded-2xl p-5 md:p-6 min-h-[100px] md:min-h-[120px] text-sm md:text-base"
              />
            </div>
          </div>

          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="cloud-upload-alt" className="text-secondary" />
              <h3 className="text-lg md:text-xl font-bold text-white">ملفات المذكرة (PDF)</h3>
            </div>

            <div className="form-group">
              <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-4 mr-1">ملفات المذكرة (حد أقصى ملفين)</label>
              <FilePicker
                accept="application/pdf"
                multiple
                files={files}
                onFilesChange={(newFiles) => setFiles(newFiles.slice(0, 2))}
                buttonText="اختيار ملفات PDF"
                emptyText="اسحب الملفات هنا أو اضغط للاختيار"
                helperText="يجب أن تكون الملفات بصيغة PDF فقط"
                disabled={isUploading}
              />
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Icon name="file-pdf" className="text-red-400" />
                        <span className="text-sm text-white truncate max-w-[200px] md:max-w-md">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-light/40">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Submit */}
        <div className="space-y-8">
          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="cog" className="text-warning" />
              <h3 className="text-lg md:text-xl font-bold text-white">إعدادات المشاركة</h3>
            </div>

            {mode === 'academy' && (
              <div className="form-group">
                <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-3 mr-1">المدرس</label>
                <Filter
                  options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                  value={teacherId}
                  onChange={setTeacherId}
                  placeholder="اختر المدرس"
                  className="w-full"
                  disabled={isUploading}
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
                disabled={isUploading}
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
                        disabled={isUploading}
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
          </div>

          {/* Action Block */}
          <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
            {isUploading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">
                    جاري الرفع...
                  </span>
                  <span className="text-3xl font-black text-white tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(66,99,235,0.5)]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-in shake duration-500">
                <Icon name="exclamation-triangle" className="text-red-500 mt-1" size="sm" />
                <span className="text-xs text-red-400 leading-tight">{formError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isUploading}
              className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_10px_30px_rgba(66,99,235,0.4)] border-none gap-3 transition-all text-sm md:text-base"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>جاري رفع المذكرة...</span>
                </>
              ) : (
                <>
                  <Icon name="cloud-upload-alt" />
                  <span>بدء الرفع الآن</span>
                </>
              )}
            </Button>
            
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.history.back()}
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
