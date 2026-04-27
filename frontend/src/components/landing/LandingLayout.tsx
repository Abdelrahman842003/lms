'use client';

import React from 'react';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen relative flex flex-col bg-[#080b14] text-white font-[Tajawal] selection:bg-[#3249A9] selection:text-white overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3249A9]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <LandingNavbar />
      
      <main className="relative z-10 flex-1 flex flex-col pt-24">
        {children}
      </main>
      
      <LandingFooter />
    </div>
  );
}
