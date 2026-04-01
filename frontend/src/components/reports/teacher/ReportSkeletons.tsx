'use client';

import React from 'react';

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse">
          <div className="h-3 bg-gray-700 rounded w-20 mb-3" />
          <div className="h-7 bg-gray-700 rounded w-16" />
          <div className="h-3 bg-gray-700 rounded w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-32 mb-4" />
      <div className="flex gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 h-16 bg-gray-700/50 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-gray-700/30 rounded-lg" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-40 mb-4" />
      <div className="space-y-3">
        <div className="flex gap-4 py-2 border-b border-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 h-3 bg-gray-700 rounded" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex-1 h-3 bg-gray-700/50 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
