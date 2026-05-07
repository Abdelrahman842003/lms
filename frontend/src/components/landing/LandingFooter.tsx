'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="relative py-8 z-20 border-t border-white/[0.04] bg-transparent">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo area */}
          <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
             <img src="/logo.png" alt="Neetaq Logo" className="w-[1.2rem] h-[1.2rem] object-contain" />
             <span className="text-white font-bold tracking-wide text-sm">نيتاق</span>
          </div>
          
          {/* Copyright */}
          <div className="text-center order-3 md:order-2">
            <p className="text-gray-500/60 text-[0.75rem]">
              © {new Date().getFullYear()} نيتاق للتقنيات التعليمية. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3 text-[0.85rem] text-gray-400 order-2 md:order-3">
            <Link href="/about" className="hover:text-[#3249A9] transition-colors">عن نيتاق</Link>
            <Link href="/features" className="hover:text-[#3249A9] transition-colors">المميزات</Link>
            <Link href="/pricing" className="hover:text-[#3249A9] transition-colors">الأسعار</Link>
            <Link href="/contact" className="hover:text-[#3249A9] transition-colors">تواصل معنا</Link>
            <button onClick={() => window.open('/privacy', '_blank')} className="hover:text-[#3249A9] transition-colors">سياسة الخصوصية</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
