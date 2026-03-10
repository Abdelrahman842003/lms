'use client';

/**
 * PdfViewerModal
 * ─────────────────────────────────────────────────────────────────────────────
 * A full-screen modal PDF viewer with:
 *   • Zoom in/out + fit-page / fit-width
 *   • Page navigation
 *   • Text search (highlight matches)
 *   • Text highlight (select + click toolbar button)
 *   • Dark overlay backdrop
 *   • Lazy-loads the heavy pdfjs-dist only on the client
 *
 * Usage:
 *   <PdfViewerModal
 *     open={open}
 *     url={signedUrl}           // pre-fetched signed URL
 *     fileName="lecture.pdf"
 *     onClose={() => setOpen(false)}
 *   />
 *
 * The component is completely self-contained – no store, no context.
 */

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@/components/ui/Icon';

// ─── Lazy-load react-pdf-viewer (heavy) only on client ───────────────────────

// We use dynamic() so Next.js never bundles pdfjs into the SSR chunk.
const PdfCore = dynamic(
  () => import('./PdfViewerCore').then((m) => m.PdfViewerCore),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-gray-400 text-sm">جاري تحميل الملف…</p>
        </div>
      </div>
    ),
  }
);

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PdfViewerModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Signed (or public) URL pointing directly at the PDF bytes */
  url: string;
  /** Shown in the modal title bar */
  fileName?: string;
  /** Called when the user closes the modal */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PdfViewerModal({
  open,
  url,
  fileName = 'document.pdf',
  onClose,
}: PdfViewerModalProps) {
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

  if (!open) return null;

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
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
            <Icon name="file-pdf" className="text-red-400" size="sm" />
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
      <div className="flex-1 overflow-hidden flex flex-col">
        <PdfCore url={url} fileName={fileName} />
      </div>
    </div>
  );
}
