'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'مميزات المنصة', path: '/features' },
    { name: 'من نحن', path: '/about' },
    { name: 'التواصل', path: '/contact' },
  ];

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex justify-center transition-all duration-300 ${isScrolled ? 'pt-4' : 'pt-6 md:pt-8'}`}>
      <nav 
        className={`w-[92%] md:w-[85%] max-w-[1200px] bg-[#15192B]/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-full flex items-center justify-between px-4 md:px-8 py-3 transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] ${isScrolled ? 'bg-[#15192B]/70 border-white/20' : ''}`}
      >
        {/* Logo area */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group cursor-pointer">
          <img src="/logo.png" alt="Neetaq Logo" className="w-[1.2rem] h-[1.2rem] md:w-[1.6rem] md:h-[1.6rem] object-contain group-hover:scale-110 transition-transform" />
          <span className="text-white font-bold tracking-wide text-base md:text-xl">نيتاق</span>
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

        {/* CTA */}
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center px-5 md:px-7 py-2 md:py-2.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.8rem] md:text-[0.95rem] shadow-[0_0_20px_rgba(50,73,169,0.2)]"
          >
            دخول لمنصتك
          </Link>
          
          {/* Mobile Menu Button - simple placeholder for now */}
          <button className="lg:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 focus:outline-none bg-white/5 rounded-full border border-white/10">
            <span className="w-4 h-0.5 bg-white rounded"></span>
            <span className="w-4 h-0.5 bg-white rounded"></span>
          </button>
        </div>
      </nav>
    </div>
  );
}
