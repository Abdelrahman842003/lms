'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

interface MobileBottomNavProps {
  role: 'teacher' | 'student' | 'secretary' | 'parent' | 'academy';
}

const getNavItems = (role: string): NavItem[] => {
  if (role === 'student') {
    return [
      { id: 'dashboard', label: 'الرئيسية', icon: 'home', href: '/student/dashboard' },
      { id: 'mistakes', label: 'أخطائي', icon: 'exclamation-circle', href: '/student/mistakes' },
      { id: 'lectures', label: 'محاضراتي', icon: 'book-open', href: '/student/lectures' },
      { id: 'videos', label: 'فيديوهاتي', icon: 'film', href: '/student/videos' },
      { id: 'exams', label: 'امتحاناتي', icon: 'file-alt', href: '/student/exams' },
    ];
  }

  if (role === 'teacher' || role === 'secretary') {
    const base = role === 'teacher' ? '/teacher' : '/teacher'; // Both use /teacher routes mostly
    return [
      { id: 'dashboard', label: 'الرئيسية', icon: 'home', href: `${base}/dashboard` },
      { id: 'students', label: 'الطلاب', icon: 'user-graduate', href: `${base}/students` },
      { id: 'lectures', label: 'المحاضرات', icon: 'book-open', href: `${base}/lectures` },
      { id: 'attendance', label: 'الحضور', icon: 'calendar-check', href: `${base}/attendance` },
      { id: 'exams', label: 'الامتحانات', icon: 'file-alt', href: `${base}/exams` },
    ];
  }

  if (role === 'academy') {
    return [
      { id: 'dashboard', label: 'الرئيسية', icon: 'home', href: '/academy/dashboard' },
      { id: 'teachers', label: 'المدرسين', icon: 'chalkboard-teacher', href: '/academy/teachers' },
      { id: 'students', label: 'الطلاب', icon: 'user-graduate', href: '/academy/students' },
      { id: 'attendance', label: 'الحضور', icon: 'calendar-check', href: '/academy/attendance' },
      { id: 'reports', label: 'التقارير', icon: 'chart-bar', href: '/academy/reports' },
    ];
  }

  return [];
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ role }) => {
  const pathname = usePathname();
  const items = getNavItems(role);

  if (items.length === 0 || role === 'parent') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[100] md:hidden">
      <nav className="premium-glass premium-border rounded-[2rem] px-4 py-3 shadow-2xl flex items-center justify-around gap-2 backdrop-blur-3xl bg-black/40">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1.5 transition-all duration-500 group py-1.5 ${
                isActive ? 'text-primary' : 'text-gray-light/40 hover:text-white/60'
              }`}
            >
              {/* Active Glow */}
              {isActive && (
                <div className="absolute -top-1 w-8 h-8 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              )}
              
              <div className={`relative flex items-center justify-center transition-transform duration-500 ${isActive ? 'scale-110 -translate-y-1' : 'group-active:scale-95'}`}>
                 <Icon 
                   name={item.icon as any} 
                   size={isActive ? 'lg' : 'sm'} 
                   className={isActive ? 'drop-shadow-[0_0_8px_rgba(66,99,235,0.6)]' : ''} 
                 />
              </div>
              
              <span className={`text-[9px] font-black tracking-tight transition-all duration-500 whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'}`}>
                {item.label}
              </span>

              {/* Bottom Dot */}
              <div className={`absolute -bottom-1 w-1 h-1 rounded-full bg-primary transition-all duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
