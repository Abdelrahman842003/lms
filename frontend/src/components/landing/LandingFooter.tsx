'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';

export default function LandingFooter() {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const projectName = useMemo(() => {
    if (!settings.landing_page_content) return 'نيتاق';
    try {
      const content = JSON.parse(settings.landing_page_content);
      return content.project_name || 'نيتاق';
    } catch (e) {
      return 'نيتاق';
    }
  }, [settings.landing_page_content]);

  return (
    <footer className="relative py-8 z-20 border-t border-white/[0.04] bg-transparent">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo area */}
          <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
             <img src="/logo.png" alt={`${projectName} Logo`} className="w-[1.2rem] h-[1.2rem] object-contain" />
             <span className="text-white font-bold tracking-wide text-sm">{projectName}</span>
          </div>
          
          {/* Copyright */}
          <div className="text-center order-3 md:order-2">
            <p className="text-gray-500/60 text-[0.75rem]">
              © {new Date().getFullYear()} {projectName} للتقنيات التعليمية. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3 text-[0.85rem] text-gray-400 order-2 md:order-3">
            <Link href="/about" className="hover:text-[#3249A9] transition-colors">عن {projectName}</Link>
            <Link href="/features" className="hover:text-[#3249A9] transition-colors">المميزات</Link>
            <Link href="/pricing" className="hover:text-[#3249A9] transition-colors">الأسعار</Link>
            <Link href="/contact" className="hover:text-[#3249A9] transition-colors">تواصل معنا</Link>
            <button 
              onClick={() => setIsTermsOpen(true)} 
              className="hover:text-[#3249A9] transition-colors focus:outline-none"
            >
              شروط الاستخدام
            </button>
            <button 
              onClick={() => setIsPrivacyOpen(true)} 
              className="hover:text-[#3249A9] transition-colors focus:outline-none"
            >
              سياسة الخصوصية
            </button>
          </div>
        </div>
      </div>

      <PrivacyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
      />
      
      <TermsModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />
    </footer>
  );
}
