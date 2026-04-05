'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PdfViewerModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Signed (or public) URL pointing directly at the PDF bytes */
  url: string;
  /** Shown in the modal title bar */
  fileName?: string;
  /** Optional mime type to choose the simplest renderer */
  mimeType?: string;
  /** Called when the user closes the modal */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PdfViewerModal({
  open,
  url,
  fileName = 'document.pdf',
  mimeType,
  onClose,
}: PdfViewerModalProps) {
  const [isViewerLoading, setIsViewerLoading] = useState(true);

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

  useEffect(() => {
    if (!open) return;
    setIsViewerLoading(true);
  }, [open, url, mimeType]);

  if (!open) return null;

  const normalizedMime = (mimeType || '').toLowerCase();
  const isImage = normalizedMime.startsWith('image/');
  const isPdf = normalizedMime === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`عرض: ${fileName}`}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#0d1120]/90 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Icon name={isImage ? 'image' : isPdf ? 'file-pdf' : 'file-alt'} className="text-primary" size="sm" />
          </div>
          <span className="text-white text-sm font-medium truncate max-w-[60vw]">{fileName}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label="إغلاق"
        >
          <Icon name="times" size="sm" />
        </button>
      </div>

      {/* ── Viewer area ── */}
      <div className="flex-1 overflow-hidden p-0">
        <div className="relative h-full w-full border border-white/10 bg-[#0d1120]/80 overflow-hidden">
          {isImage ? (
            <div className="h-full w-full flex items-center justify-center p-3">
              <Image
                src={url}
                alt={fileName}
                width={1400}
                height={900}
                unoptimized
                className="max-h-full max-w-full object-contain rounded-lg"
                onLoad={() => setIsViewerLoading(false)}
                onError={() => setIsViewerLoading(false)}
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              title={fileName}
              className="w-full h-full border-0"
              onLoad={() => setIsViewerLoading(false)}
              onError={() => setIsViewerLoading(false)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center gap-3 p-6">
              <Icon name="file-alt" className="text-primary" />
              <p className="text-gray-300 text-sm">هذا النوع لا يدعم المعاينة المباشرة.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm"
              >
                <Icon name="external-link-alt" size="sm" />
                فتح الملف في تبويب جديد
              </a>
            </div>
          )}

          {(isPdf || isImage) && isViewerLoading && (
            <div className="absolute inset-0 bg-[#0d1120]/85 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-gray-300 text-sm">جاري تحميل الملف…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
