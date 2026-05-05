'use client';

import React from 'react';
import { useVideoUploadContext } from '@/contexts/VideoUploadContext';
import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';

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

export function FloatingUploadManager() {
  const { state, isMinimized, setIsMinimized, cancelUpload, reset, savedSession, resumeUpload, pauseUpload } = useVideoUploadContext();
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isVisible = state.phase !== 'draft' || !!savedSession;
  const isUploading = ['initiating', 'uploading', 'retrying', 'completing'].includes(state.phase);

  if (!isVisible || !user) return null;

  const mode = user.role === 'academy' ? 'academy' : 'teacher';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resumeUpload(file);
    }
  };

  const isRecoverable = (savedSession && state.phase === 'draft') || state.phase === 'interrupted';

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 transform ${isMinimized ? 'translate-y-4 translate-x-4 scale-90' : 'translate-y-0 translate-x-0 scale-100'}`}>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        style={{ display: 'none' }} 
        accept="video/*"
      />

      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden group transition-colors duration-500 ${isRecoverable ? 'bg-yellow-500 animate-pulse' : (state.phase === 'paused' ? 'bg-orange-500' : 'bg-primary')}`}
        >
          <Icon name={isRecoverable ? 'bolt' : (state.phase === 'paused' ? 'pause' : 'upload')} className={isUploading ? 'animate-bounce' : ''} />
          {isUploading && (
            <div 
              className="absolute inset-x-0 bottom-0 bg-white/20 transition-all duration-300"
              style={{ height: `${state.progress}%` }}
            />
          )}
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold px-1 rounded-full border-2 border-background">
            {state.progress}%
          </span>
        </button>
      ) : (
        <div className={`w-80 bg-gray-900 border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 transition-all duration-500 ${isRecoverable ? 'border-yellow-500/50 shadow-yellow-500/20' : (state.phase === 'paused' ? 'border-orange-500/50 shadow-orange-500/20' : 'border-white/10')}`}>
          {/* Header */}
          <div className={`${isRecoverable ? 'bg-yellow-500/20' : (state.phase === 'paused' ? 'bg-orange-500/20' : 'bg-gray-800')} px-4 py-3 flex items-center justify-between border-b border-white/5 transition-colors duration-500`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isUploading ? 'bg-primary animate-pulse' : (isRecoverable ? 'bg-yellow-500 animate-pulse' : (state.phase === 'paused' ? 'bg-orange-500' : 'bg-green-500'))}`} />
              <span className="text-sm font-semibold text-white">
                {isRecoverable ? 'استعادة مجهودك!' : (state.phase === 'paused' ? 'الرفع متوقف' : 'مدير الرفع')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <Icon name="minus" size="xs" />
              </button>
              {state.phase !== 'uploading' && state.phase !== 'initiating' && state.phase !== 'completing' && (
                <button 
                  onClick={reset}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  <Icon name="times" size="xs" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {isRecoverable ? (
              <div className="space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Icon name="bolt" size="3x" />
                  </div>
                  <p className="text-xs text-yellow-100 leading-relaxed relative z-10">
                    {state.phase === 'interrupted' ? 'انقطع الرفع! لا تقلق، يمكنك الاستكمال:' : 'رائع! اكتشفنا فيديو لم يكتمل رفعه:'}
                    <br />
                    <span className="font-bold text-white block mt-1">"{savedSession?.fileInfo.name || 'الفيديو غير معروف'}"</span>
                  </p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="primary" 
                  size="sm" 
                  className="w-full bg-yellow-600 hover:bg-yellow-500 border-none text-black font-extrabold shadow-lg shadow-yellow-600/20"
                >
                  <Icon name="bolt" size="xs" />
                  <span>استكمال بالسرعة القصوى</span>
                </Button>
                <p className="text-[10px] text-gray-500 text-center italic">
                  * مجهودك في أمان، سنكمل من حيث توقفت.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{PHASE_LABELS[state.phase] ?? 'جاري العمل...'}</p>
                  <span className="text-sm font-bold text-primary tabular-nums">{state.progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${state.phase === 'failed' ? 'bg-red-500' : (state.phase === 'paused' ? 'bg-orange-500' : 'bg-primary')}`}
                    style={{ width: `${state.progress}%` }}
                  />
                </div>

                {/* Details */}
                {isUploading && state.totalParts > 1 && (
                  <p className="text-[10px] text-gray-500">
                    جاري رفع الجزء <span className="text-gray-300">{state.currentPart}</span> من <span className="text-gray-300">{state.totalParts}</span>
                  </p>
                )}

                {state.error && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    {state.error}
                  </p>
                )}

                {state.phase === 'completed' && (
                  <div className="flex flex-col gap-2 text-center bg-green-500/10 p-3 rounded-lg border border-green-500/20 animate-in zoom-in-95">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1 shadow-lg shadow-green-500/20">
                      <Icon name="check" className="text-black" />
                    </div>
                    <span className="text-xs font-bold text-green-400">تم الرفع بنجاح! مجهودك في أمان.</span>
                    <p className="text-[10px] text-gray-400 italic">جاري معالجة الفيديو بجودة عالية...</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {isUploading && (
                    <>
                      <Button 
                        onClick={pauseUpload}
                        variant="outline" 
                        size="xs" 
                        className="flex-1 py-1.5"
                      >
                        إيقاف مؤقت
                      </Button>
                      <Button 
                        onClick={() => cancelUpload(mode)}
                        variant="destructive" 
                        size="xs" 
                        className="flex-1 py-1.5"
                      >
                        إلغاء
                      </Button>
                    </>
                  )}
                  
                  {state.phase === 'paused' && (
                    <>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="primary" 
                        size="xs" 
                        className="flex-1 py-1.5"
                      >
                        استئناف
                      </Button>
                      <Button 
                        onClick={() => cancelUpload(mode)}
                        variant="destructive" 
                        size="xs" 
                        className="flex-1 py-1.5"
                      >
                        إلغاء
                      </Button>
                    </>
                  )}

                  {!isUploading && state.phase === 'failed' && (
                    <Button 
                      onClick={reset}
                      variant="outline" 
                      size="xs" 
                      className="w-full py-1.5"
                    >
                      حاول مرة أخرى
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
