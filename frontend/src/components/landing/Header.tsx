'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
      <nav className="landing-nav">
        <Link href="/" className="landing-logo">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span>منصة التعليم</span>
        </Link>

        <ul className="landing-nav-links">
          <li><a href="#features">الميزات</a></li>
          <li><a href="#tracking">المتابعة</a></li>
          <li><Link href="/contact">تواصل معنا</Link></li>
        </ul>

        <div className="landing-nav-actions">
          <Link href="/login" className="nav-btn nav-btn-ghost">
            الدخول
          </Link>
          <Link href="/login" className="nav-btn nav-btn-primary">
            ابدأ الآن
          </Link>
        </div>

        <button className="mobile-menu-btn" aria-label="القائمة">
          <i className="fas fa-bars"></i>
        </button>
      </nav>
    </header>
  );
}
