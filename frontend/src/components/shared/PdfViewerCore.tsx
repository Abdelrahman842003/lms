'use client';

/**
 * PdfViewerCore
 * ─────────────────────────────────────────────────────────────────────────────
 * The actual react-pdf-viewer implementation, lazy-loaded via dynamic().
 * Includes: zoom, navigation, text search, highlight plugin.
 * NOTE: This file is excluded from SSR via serverExternalPackages in next.config.js
 */

import React, { useState } from 'react';
import {
  Viewer as _Viewer,
  Worker as _Worker,
  SpecialZoomLevel,
  type ViewerProps,
  type WorkerProps,
} from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';

// Cast to FC to satisfy React 18 JSX types (library ships React 17 class typings)
const PdfViewer = _Viewer as unknown as React.FC<ViewerProps>;
const PdfWorker = _Worker as unknown as React.FC<WorkerProps>;

// ─── Styles ───────────────────────────────────────────────────────────────────
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

// ─── pdfjs worker ─────────────────────────────────────────────────────────────
// We use the CDN worker that matches pdfjs-dist version to avoid bundling it.
const PDFJS_VERSION = '3.11.174';
const WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

// ─── Props ────────────────────────────────────────────────────────────────────
interface PdfViewerCoreProps {
  url: string;
  fileName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PdfViewerCore({ url }: PdfViewerCoreProps) {
  const [searchKeyword, setSearchKeyword] = useState('');

  // ── Search plugin ──
  const searchPluginInstance = searchPlugin();
  const { highlight, clearHighlights } = searchPluginInstance;

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      highlight(searchKeyword.trim());
    } else {
      clearHighlights();
    }
  };

  // ── Highlight plugin (text selection → highlight) ──
  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
    renderHighlightTarget: ({ toggle }) => (
      <div
        style={{
          background: '#fddb3a',
          borderRadius: '4px',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#111',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        onClick={toggle}
      >
        ✏️ هايلايت
      </div>
    ),
    renderHighlightContent: ({ cancel }) => (
      <div
        style={{
          background: '#1e2a3a',
          border: '1px solid #fddb3a55',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#aaa', fontSize: '12px' }}>تم تحديد النص</span>
        <button
          onClick={cancel}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          إلغاء
        </button>
      </div>
    ),
  });

  // ── Default layout plugin (toolbar + sidebar) ──
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs,
  });

  return (
    <div className="flex flex-col h-full">
      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#0d1120]/70 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="ابحث في الملف..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
            dir="auto"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => { setSearchKeyword(''); clearHighlights(); }}
              className="text-gray-500 hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm rounded-xl transition-all"
        >
          بحث
        </button>
      </div>

      {/* ── PDF Viewer ── */}
      <div
        className="flex-1 overflow-hidden"
        style={{ direction: 'ltr' }}
      >
        <PdfWorker workerUrl={WORKER_URL}>
          <div
            style={{
              height: '100%',
              '--rpv-core__inner-page-background-color': '#1a1f2e',
            } as React.CSSProperties}
          >
            <PdfViewer
              fileUrl={url}
              defaultScale={SpecialZoomLevel.PageWidth}
              plugins={[
                defaultLayoutPluginInstance,
                highlightPluginInstance,
                searchPluginInstance,
              ]}
              theme="dark"
              renderError={(error: { message?: string }) => (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-xl">!</span>
                  </div>
                  <p className="text-red-300 text-sm">تعذّر تحميل الملف</p>
                  {error.message && <p className="text-gray-500 text-xs">{error.message}</p>}
                </div>
              )}
              renderLoader={(percentages: number) => (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#1e2a3a" strokeWidth="6" />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none" stroke="#4263eb" strokeWidth="6"
                        strokeDasharray={`${Math.PI * 56 * percentages / 100} ${Math.PI * 56}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {Math.round(percentages)}%
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">جاري تحميل الملف…</p>
                </div>
              )}
            />
          </div>
        </PdfWorker>
      </div>
    </div>
  );
}
