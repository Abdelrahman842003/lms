'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/EnhancedAuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children?: NavItem[];
}

interface MobileBottomNavProps {
  role: 'teacher' | 'student' | 'secretary' | 'parent' | 'academy';
}

const getNavItems = (role: string): NavItem[] => {
  const commonItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: 'home',
      href: role === 'secretary' ? '/teacher/dashboard' : `/${role}/dashboard`,
    },
  ];

  if (role === 'academy') {
    return [
      ...commonItems,
      {
        id: 'teachers',
        label: 'المدرسين',
        icon: 'chalkboard-teacher',
        href: '/academy/teachers',
      },
      {
        id: 'students',
        label: 'الطلاب',
        icon: 'user-graduate',
        href: '/academy/students',
      },
      {
        id: 'secretaries',
        label: 'السكرتيرات',
        icon: 'user-tie',
        href: '/academy/secretaries',
      },
      {
        id: 'groups',
        label: 'المجموعات',
        icon: 'layer-group',
        href: '/academy/groups',
      },
      {
        id: 'grades',
        label: 'الصفوف',
        icon: 'graduation-cap',
        href: '/academy/grades',
      },
      {
        id: 'attendance',
        label: 'الحضور والانصراف',
        icon: 'calendar-check',
        href: '/academy/attendance',
      },
      {
        id: 'student_lectures',
        label: 'محاضرات الطلاب',
        icon: 'book-open',
        href: '/academy/lectures',
      },
      {
        id: 'videos',
        label: 'الفيديوهات التعليمية',
        icon: 'film',
        href: '/academy/videos',
      },
      {
        id: 'exams',
        label: 'الامتحانات',
        icon: 'file-alt',
        href: '/academy/exams',
      },
      {
        id: 'notifications_academy',
        label: 'الإشعارات',
        icon: 'bell',
        href: '/academy/notifications',
      },
      {
        id: 'reports_academy',
        label: 'التقارير',
        icon: 'chart-bar',
        href: '/academy/reports',
      },
      {
        id: 'gamification',
        label: 'لوحة الشرف',
        icon: 'trophy',
        href: '/academy/gamification',
      },
    ];
  }

  if (role === 'teacher' || role === 'secretary') {
    const base = '/teacher';
    return [
      ...commonItems,
      {
        id: 'students',
        label: 'الطلاب',
        icon: 'user-graduate',
        href: `${base}/students`,
      },
      {
        id: 'secretaries',
        label: 'السكرتارية',
        icon: 'user-tie',
        href: `${base}/secretaries`,
      },
      {
        id: 'groups',
        label: 'المجموعات',
        icon: 'layer-group',
        href: `${base}/groups`,
      },
      {
        id: 'grades',
        label: 'الصفوف',
        icon: 'graduation-cap',
        href: `${base}/grades`,
      },
      {
        id: 'lectures',
        label: 'المحاضرات',
        icon: 'book-open',
        href: `${base}/lectures`,
      },
      {
        id: 'videos',
        label: 'الفيديوهات التعليمية',
        icon: 'film',
        href: `${base}/videos`,
      },
      {
        id: 'attendance',
        label: 'الحضور والانصراف',
        icon: 'calendar-check',
        href: `${base}/attendance`,
      },
      {
        id: 'exams',
        label: 'الامتحانات',
        icon: 'file-alt',
        href: `${base}/exams`,
      },
      {
        id: 'notifications',
        label: 'الإخطارات والدعم',
        icon: 'bell',
        href: `${base}/notifications`,
      },
      {
        id: 'gamification',
        label: 'لوحة الشرف',
        icon: 'trophy',
        href: `${base}/gamification`,
      },
      {
        id: 'reports',
        label: 'التقارير',
        icon: 'chart-bar',
        href: `${base}/reports`,
      },
    ];
  }

  // Student
  return [
    ...commonItems,
    {
      id: 'mistakes',
      label: 'أخطائي',
      icon: 'exclamation-circle',
      href: '/student/mistakes',
    },
    {
      id: 'lectures',
      label: 'المحاضرات',
      icon: 'book-open',
      href: '/student/lectures',
    },
    {
      id: 'videos',
      label: 'الفيديوهات التعليمية',
      icon: 'film',
      href: '/student/videos',
    },
    {
      id: 'exams',
      label: 'الامتحانات',
      icon: 'file-alt',
      href: '/student/exams',
    },
    {
      id: 'notifications',
      label: 'الإخطارات والدعم',
      icon: 'bell',
      href: '/student/notifications',
    },
    {
      id: 'achievements',
      label: 'إنجازاتي',
      icon: 'medal',
      href: '/student/achievements',
    },
  ];
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ role }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = getNavItems(role);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  if (items.length === 0 || role === 'parent') return null;

  const visibleItems = items.slice(0, 3);
  const hiddenItems = items.slice(3);
  const hasMore = hiddenItems.length > 0;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* More Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          <div 
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[92%] max-w-sm max-h-[70vh] overflow-hidden flex flex-col"
            ref={menuRef}
          >
            <div className="premium-glass premium-border rounded-[2.5rem] p-4 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-500 bg-black/80 backdrop-blur-3xl overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {hiddenItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all border ${
                      pathname === item.href 
                        ? 'bg-primary/20 text-primary border-primary/20 shadow-lg shadow-primary/10' 
                        : 'bg-white/5 text-gray-light/60 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={item.icon as any} size="sm" />
                    <span className="text-[10px] font-black tracking-tight text-center leading-tight">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Logout & Profile Section */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <Link
                  href={`/${role}/profile`}
                  className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 text-white/80 font-bold text-xs border border-white/5"
                >
                  <Icon name="user" size="xs" className="text-primary" />
                  <span>الملف الشخصي</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-500/10 text-rose-400 font-black text-xs border border-rose-500/10"
                >
                  <Icon name="sign-out-alt" size="xs" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="w-6 h-6 bg-black/80 border-r border-b border-white/10 absolute -bottom-3 left-1/2 -translate-x-1/2 rotate-45 z-[-1]" />
          </div>
        </div>
      )}

      {/* Main Nav Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[200] md:hidden">
        <nav className="premium-glass premium-border rounded-[2rem] px-4 py-3 shadow-2xl flex items-center justify-between gap-1 backdrop-blur-3xl bg-black/40">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 group py-1.5 ${
                  isActive ? 'text-primary' : 'text-gray-light/40'
                }`}
              >
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
                
                <span className={`text-[9px] font-black tracking-tight transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {item.label}
                </span>

                <div className={`absolute -bottom-1 w-1 h-1 rounded-full bg-primary transition-all duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
              </Link>
            );
          })}

          {hasMore && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 group py-1.5 ${
                isMenuOpen ? 'text-primary' : 'text-gray-light/40'
              }`}
            >
              <div className={`relative flex items-center justify-center transition-transform duration-500 ${isMenuOpen ? 'scale-110 -translate-y-1 rotate-180' : 'group-active:scale-95'}`}>
                 <Icon 
                   name="ellipsis-h" 
                   size={isMenuOpen ? 'lg' : 'sm'} 
                 />
              </div>
              
              <span className={`text-[9px] font-black tracking-tight transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-40'}`}>
                المزيد
              </span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
