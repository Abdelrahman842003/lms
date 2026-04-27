'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 z-20 mt-10 before:content-[''] before:absolute before:inset-y-0 before:-left-[50vw] before:-right-[50vw] before:bg-[#0c0f1a] before:border-t before:border-white/[0.04] before:-z-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo area */}
          <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
            <Link href="/" className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
               <img src="/logo.png" alt="Neetaq Logo" className="w-[1.5rem] h-[1.5rem] object-contain" />
               <span className="text-white font-bold tracking-wide text-lg">نيتاق</span>
            </Link>
            <p className="text-gray-500 text-sm max-w-[300px] text-center md:text-right leading-relaxed">
              نظام تشغيل تعليمي متكامل مصمم لتمكين المعلمين والمؤسسات التعليمية.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-4 text-[0.9rem] text-gray-400 w-full md:w-auto">
            <Link href="/about" className="hover:text-[#3249A9] transition-colors">عن نيتاق</Link>
            <Link href="/features" className="hover:text-[#3249A9] transition-colors">المميزات</Link>
            <Link href="/contact" className="hover:text-[#3249A9] transition-colors">تواصل معنا</Link>
            <button onClick={() => window.open('/privacy', '_blank')} className="hover:text-[#3249A9] transition-colors">سياسة الخصوصية</button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500/60 text-[0.8rem] text-center md:text-right">
            © {currentYear} نيتاق للتقنيات التعليمية. جميع الحقوق محفوظة.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><i className="fab fa-instagram"></i></a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
