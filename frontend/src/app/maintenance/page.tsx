'use client';

import React from 'react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-tools text-6xl text-primary"></i>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">خبر عظيم منصتكم في التطوير</h1>
          <p className="text-gray-400 text-lg">
            نقوم حالياً ببعض التحديثات لتحسين تجربتكم. سنعود قريباً!
          </p>
        </div>

        {/* Progress Bar (Visual only) */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-primary w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
