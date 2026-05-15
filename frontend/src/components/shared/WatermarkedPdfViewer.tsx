'use client';

import React from 'react';
import { PdfViewerCore } from './PdfViewerCore';
import { useCoreAuth } from '@/contexts/CoreAuthContext';

interface WatermarkedPdfViewerProps {
  url: string;
  fileName?: string;
}

export function WatermarkedPdfViewer({ url, fileName }: WatermarkedPdfViewerProps) {
  const { user } = useCoreAuth();
  
  // Create watermark text: Name + Phone
  const watermarkText = user ? `${user.name} - ${user.phone}` : 'محمي بحقوق الطبع والنشر';

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      {/* ── PDF Viewer Core ── */}
      <PdfViewerCore url={url} fileName={fileName} hideDownload={true} />

      {/* ── Watermark Overlay ── */}
      {/* pointer-events-none ensures user can still interact with the PDF viewer underneath */}
      <div 
        className="absolute inset-0 pointer-events-none z-[100] overflow-hidden flex flex-wrap gap-x-20 gap-y-24 items-center justify-center content-center opacity-[0.05] rotate-[-25deg]"
        style={{ width: '150%', height: '150%', left: '-25%', top: '-25%' }}
      >
        {Array.from({ length: 120 }).map((_, i) => (
          <span 
            key={i} 
            className="text-lg font-bold text-gray-400 whitespace-nowrap"
          >
            {watermarkText}
          </span>
        ))}
      </div>

      {/* ── Prevent Right Click & Selection ── */}
      <style jsx global>{`
        .rpv-core__viewer {
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        /* Hide common browser UI for download if possible */
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
