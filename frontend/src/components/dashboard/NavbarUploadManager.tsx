'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useVideoUploadContext } from '@/contexts/VideoUploadContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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

export const NavbarUploadManager: React.FC = () => {
  const { 
    state, 
    cancelUpload, 
    reset, 
    savedSession, 
    resumeUpload, 
    pauseUpload 
  } = useVideoUploadContext();
  
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVisible = state.phase !== 'draft' || !!savedSession;
  const isUploading = ['initiating', 'uploading', 'retrying', 'completing'].includes(state.phase);
  const isRecoverable = (savedSession && state.phase === 'draft') || state.phase === 'interrupted';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Only show for teachers/academy and when there's an active or saved upload
  if (!user || (user.role !== 'teacher' && user.role !== 'academy' && user.role !== 'secretary') || !isVisible) {
    return null;
  }

  const mode = user.role === 'academy' ? 'academy' : 'teacher';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resumeUpload(file);
    }
  };

  return (
    <div className="navbar-upload-manager ux-relative" ref={containerRef}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="ux-hidden" 
        accept="video/*"
      />

      {/* Navbar Icon/Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`navbar-upload-trigger ux-relative ux-flex ux-items-center ux-gap-2 ux-px-3 ux-rounded-xl ux-transition-all ${
          isUploading ? 'ux-text-primary ux-bg-primary/10' : 
          isRecoverable ? 'ux-text-yellow-500 ux-bg-yellow-500/10 ux-animate-pulse' : 
          state.phase === 'paused' ? 'ux-text-orange-500 ux-bg-orange-500/10' :
          'ux-text-gray-400 ux-hover-bg-white/5'
        }`}
      >
        <div className="ux-relative">
          <Icon 
            name={isRecoverable ? 'bolt' : (state.phase === 'paused' ? 'pause' : 'upload')} 
            size="sm" 
            className={isUploading ? 'ux-animate-bounce' : ''} 
          />
          {isUploading && (
             <span className="ux-absolute -ux-top-1 -ux-right-1 ux-w-2 ux-h-2 ux-bg-primary ux-rounded-full ux-animate-ping" />
          )}
        </div>
        
        <span className="navbar-upload-progress ux-text-xs ux-font-bold ux-tabular-nums">
          {state.progress}%
        </span>
      </Button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="ux-absolute ux-top-full ux-left-0 ux-mt-2 ux-w-72 ux-bg-gray-900 ux-border ux-border-white/10 ux-rounded-2xl ux-shadow-2xl ux-overflow-hidden ux-z-50 ux-animate-in ux-slide-in-from-top-2 ux-duration-200">
          {/* Header */}
          <div className={`ux-px-4 ux-py-3 ux-flex ux-items-center ux-justify-between ux-border-b ux-border-white/5 ${
            isRecoverable ? 'ux-bg-yellow-500/10' : 
            state.phase === 'paused' ? 'ux-bg-orange-500/10' : 
            'ux-bg-gray-800/50'
          }`}>
            <div className="ux-flex ux-items-center ux-gap-2">
              <div className={`ux-w-2 ux-h-2 ux-rounded-full ${
                isUploading ? 'ux-bg-primary ux-animate-pulse' : 
                isRecoverable ? 'ux-bg-yellow-500 ux-animate-pulse' : 
                'ux-bg-green-500'
              }`} />
              <span className="ux-text-xs ux-font-bold ux-text-white">
                {isRecoverable ? 'استكمال الرفع' : (state.phase === 'paused' ? 'الرفع متوقف' : 'مدير الرفع')}
              </span>
            </div>
            {state.phase !== 'uploading' && state.phase !== 'initiating' && state.phase !== 'completing' && (
              <button 
                onClick={reset}
                className="ux-p-1 ux-text-gray-500 ux-hover-text-white ux-rounded-md ux-transition-colors"
              >
                <Icon name="times" size="xs" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="ux-p-4 ux-space-y-4">
            {isRecoverable ? (
              <div className="ux-space-y-3">
                <p className="ux-text-[11px] ux-text-yellow-100/80 ux-leading-relaxed">
                  اكتشفنا فيديو لم يكتمل رفعه:
                  <span className="ux-block ux-font-bold ux-text-white ux-mt-1 ux-truncate">
                    "{savedSession?.fileInfo.name}"
                  </span>
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="primary" 
                  size="xs" 
                  className="ux-w-full ux-bg-yellow-600 ux-hover-bg-yellow-500 ux-text-black ux-font-bold"
                >
                  <Icon name="bolt" size="xs" />
                  <span>استكمال الآن</span>
                </Button>
              </div>
            ) : (
              <>
                <div className="ux-flex ux-items-center ux-justify-between">
                  <span className="ux-text-[11px] ux-text-gray-400">
                    {PHASE_LABELS[state.phase] || 'جاري المعالجة'}
                  </span>
                  <span className="ux-text-xs ux-font-bold ux-text-primary">
                    {state.progress}%
                  </span>
                </div>

                <div className="ux-h-1.5 ux-w-full ux-bg-white/5 ux-rounded-full ux-overflow-hidden">
                  <div 
                    className={`ux-h-full ux-transition-all ux-duration-300 ${
                      state.phase === 'failed' ? 'ux-bg-red-500' :
                      state.phase === 'paused' ? 'ux-bg-orange-500' :
                      'ux-bg-primary'
                    }`}
                    style={{ width: `${state.progress}%` }}
                  />
                </div>

                {state.error && (
                  <p className="ux-text-[10px] ux-text-red-400 ux-bg-red-500/10 ux-p-2 ux-rounded-lg">
                    {state.error}
                  </p>
                )}

                {state.phase === 'completed' && (
                  <div className="ux-text-center ux-bg-green-500/10 ux-p-2 ux-rounded-lg ux-border ux-border-green-500/20">
                    <p className="ux-text-[10px] ux-font-bold ux-text-green-400">تم الرفع بنجاح!</p>
                  </div>
                )}

                <div className="ux-flex ux-gap-2 ux-pt-1">
                  {isUploading && (
                    <>
                      <Button onClick={pauseUpload} variant="outline" size="xs" className="ux-flex-1 ux-text-[10px]">إيقاف</Button>
                      <Button onClick={() => cancelUpload(mode)} variant="destructive" size="xs" className="ux-flex-1 ux-text-[10px]">إلغاء</Button>
                    </>
                  )}
                  {state.phase === 'paused' && (
                    <>
                      <Button onClick={() => fileInputRef.current?.click()} variant="primary" size="xs" className="ux-flex-1 ux-text-[10px]">استئناف</Button>
                      <Button onClick={() => cancelUpload(mode)} variant="destructive" size="xs" className="ux-flex-1 ux-text-[10px]">إلغاء</Button>
                    </>
                  )}
                  {state.phase === 'failed' && (
                    <Button onClick={reset} variant="outline" size="xs" className="ux-w-full ux-text-[10px]">حاول ثانية</Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
