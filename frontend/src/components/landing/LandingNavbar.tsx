'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';

export default function LandingNavbar() {
  const { settings } = useSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const projectName = useMemo(() => {
    if (!settings.landing_page_content) return 'نيتاق';
    try {
      const content = JSON.parse(settings.landing_page_content);
      return content.project_name || 'نيتاق';
    } catch (e) {
      return 'نيتاق';
    }
  }, [settings.landing_page_content]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'مميزات المنصة', path: '/features' },
    { name: 'الأسعار', path: '/pricing' },
    { name: 'من نحن', path: '/about' },
    { name: 'التواصل', path: '/contact' },
  ];

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[100] flex justify-center transition-all duration-300 ${isScrolled ? 'pt-4' : 'pt-6 md:pt-8'}`}>
        <nav 
          className={`w-[92%] md:w-[85%] max-w-[1200px] bg-[#15192B]/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-full flex items-center justify-between px-4 md:px-8 py-3 transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] ${isScrolled ? 'bg-[#15192B]/70 border-white/20' : ''}`}
        >
          {/* Logo area */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group cursor-pointer">
            <img src="/logo.png" alt={`${projectName} Logo`} className="w-[1.2rem] h-[1.2rem] md:w-[1.6rem] md:h-[1.6rem] object-contain group-hover:scale-110 transition-transform" />
            <span className="text-white font-bold tracking-wide text-base md:text-xl">{projectName}</span>
          </Link>
          
          {/* Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-[0.9rem] font-medium transition-all duration-300 hover:text-[#3249A9] ${isActive ? 'text-[#3249A9]' : 'text-gray-300'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/login"
              className="flex items-center justify-center px-4 md:px-7 py-2 md:py-2.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.75rem] md:text-[0.95rem] shadow-[0_0_20px_rgba(50,73,169,0.2)]"
            >
              دخول المنصة
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 bg-white/5 rounded-full border border-white/10"
            >
              <span className={`w-4 h-0.5 bg-white rounded transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-4 h-0.5 bg-white rounded transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-4 h-0.5 bg-white rounded transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[90] bg-[#0c0f1a]/95 backdrop-blur-2xl transition-all duration-500 lg:hidden flex flex-col items-center justify-center gap-8 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-2xl font-bold transition-all duration-300 ${isActive ? 'text-[#3249A9]' : 'text-white hover:text-[#3249A9]'}`}
              >
                {link.name}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="mt-4 px-10 py-4 bg-[#3249A9] text-white font-black rounded-2xl text-xl shadow-[0_0_30px_rgba(50,73,169,0.3)]"
          >
            ابدأ الآن
          </Link>
      </div>
    </>
  );
}
