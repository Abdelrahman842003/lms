'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { SidebarItem } from '@/types/dashboard';
import { NotificationDropdown } from './NotificationDropdown';
import { NavbarUploadManager } from './NavbarUploadManager';
import { TeacherSelectionDropdown } from './TeacherSelectionDropdown';
import { AcademySelector } from './AcademySelector';
import ScanAttendanceModal from './ScanAttendanceModal';
import { getTeacherAcademies } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from './ThemeToggle';


interface NavbarProps {
  role: 'teacher' | 'student' | 'secretary' | 'parent' | 'academy';
  user?: {
    name: string;
    avatar?: string;
  };
  onMenuClick?: () => void;
}

const getNavItems = (role: string): SidebarItem[] => {
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
        id: 'persons',
        label: 'الأشخاص',
        icon: 'users',
        href: '#',
        children: [
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
        ],
      },
      {
        id: 'academics',
        label: 'الدراسة',
        icon: 'school',
        href: '#',
        children: [
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
        ],
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
        id: 'question_bank',
        label: 'بنك الأسئلة',
        icon: 'database',
        href: '/academy/questions',
      },
      {
        id: 'notes',
        label: 'المذكرات',
        icon: 'file-pdf',
        href: '/academy/notes',
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
    return [
      ...commonItems,
      {
        id: 'persons',
        label: 'الاشخاص',
        icon: 'users',
        href: '#',
        children: [
          {
            id: 'students',
            label: 'الطلاب',
            icon: 'user-graduate',
            href: '/teacher/students',
          },
          {
            id: 'secretaries',
            label: 'السكرتارية',
            icon: 'user-tie',
            href: '/teacher/secretaries',
          },

        ],
      },
      {
        id: 'academics',
        label: 'الدراسة',
        icon: 'school',
        href: '#',
        children: [
          {
            id: 'groups',
            label: 'المجموعات',
            icon: 'layer-group',
            href: '/teacher/groups',
          },
          {
            id: 'grades',
            label: 'الصفوف',
            icon: 'graduation-cap',
            href: '/teacher/grades',
          },
        ],
      },
      {
        id: 'lectures',
        label: 'المحاضرات',
        icon: 'book-open',
        href: '/teacher/lectures',
      },
      {
        id: 'videos',
        label: 'الفيديوهات التعليمية',
        icon: 'film',
        href: '/teacher/videos',
      },
      {
        id: 'attendance',
        label: 'الحضور والانصراف',
        icon: 'calendar-check',
        href: '/teacher/attendance',
      },
      {
        id: 'exams',
        label: 'الامتحانات',
        icon: 'file-alt',
        href: '/teacher/exams',
      },
      {
        id: 'question_bank',
        label: 'بنك الأسئلة',
        icon: 'database',
        href: '/teacher/questions',
      },
      {
        id: 'notes',
        label: 'المذكرات',
        icon: 'file-pdf',
        href: '/teacher/notes',
      },
      {
        id: 'notifications',
        label: 'الإخطارات والدعم',
        icon: 'bell',
        href: '/teacher/notifications',
      },
      {
        id: 'gamification',
        label: 'لوحة الشرف',
        icon: 'trophy',
        href: '/teacher/gamification',
      },
      {
        id: 'reports',
        label: 'التقارير',
        icon: 'chart-bar',
        href: '/teacher/reports',
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
      id: 'self-test',
      label: 'اختبر نفسك',
      icon: 'vial',
      href: '/student/self-test',
    },
    {
      id: 'notes',
      label: 'مذكراتي',
      icon: 'file-pdf',
      href: '/student/notes',
    },
    {
      id: 'notifications',
      label: 'الإخطارات والدعم',
      icon: 'bell',
      href: '/student/notifications',
    },
  ];
};

const getParentNavItems = (): SidebarItem[] => {
  return [];
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    teacher: 'مدرس',
    student: 'طالب',
    secretary: 'سكرتير',
    parent: 'ولي أمر',
    academy: 'الأكاديمية',
  };
  return labels[role] || role;
};

// Map menu items to required feature keys for secretary - STRICT MODE
const secretaryPermissionMap: Record<string, string[]> = {
  // Dashboard - always visible, no permission needed
  dashboard: ['dashboard'],
  
  // Persons section
  persons: ['students', 'secretaries'],
  students: ['students', 'view students', 'create students', 'edit students', 'delete students', 'manage student groups'],
  secretaries: ['secretaries'],
  
  // Academics section
  academics: ['groups', 'grades'],
  groups: ['groups', 'view groups', 'create groups', 'edit groups', 'delete groups'],
  grades: ['grades', 'view grades', 'create grades', 'edit grades', 'delete grades'],
  
  // Lectures
  lectures: ['lectures', 'view lectures', 'create lectures', 'edit lectures', 'delete lectures', 'manage lecture attendance'],
  videos: ['videos', 'courses', 'levels', 'content_mgmt', 'view videos', 'create videos', 'edit videos', 'delete videos', 'publish videos', 'manage video comments'],
  
  // Exams
  exams: ['exams', 'exams_mgmt', 'view exams', 'create exams', 'edit exams', 'delete exams', 'grade exams'],
  question_bank: ['exams', 'exams_mgmt', 'view exams', 'create exams', 'edit exams', 'delete exams'],
  
  // Notifications
  notifications: ['notifications', 'send notifications'],
  
  // Gamification / Leaderboard
  gamification: ['honor_roll', 'view dashboard', 'view reports'],
  
  // Reports
  reports: ['reports', 'stats', 'view reports'],

  // Attendance (Mainly for Academy)
  attendance: ['attendance'],
};

const filterNavItemsByPermissions = (items: SidebarItem[], permissions: any[]): SidebarItem[] => {
  const userPermKeys = permissions.map(p => typeof p === 'string' ? p : p.key);
  const userPermNames = permissions.reduce((acc: any, p) => {
    if (typeof p !== 'string') acc[p.key] = p.name;
    return acc;
  }, {});

  const updateItemLabel = (item: SidebarItem) => {
    const requiredKeys = secretaryPermissionMap[item.id] || [];
    const matchingKey = requiredKeys.find(k => userPermNames[k]);
    if (matchingKey && userPermNames[matchingKey]) {
      return { ...item, label: userPermNames[matchingKey] };
    }
    return item;
  };

  return items.filter(item => {
    // Dashboard is always visible
    if (item.id === 'dashboard') return true;
    
    // Secretaries can NEVER be visible to a secretary
    if (item.id === 'secretaries') return false;
    
    const requiredKeys = secretaryPermissionMap[item.id];
    
    // If no permission mapping exists for this item, hide it (STRICT)
    if (!requiredKeys || requiredKeys.length === 0) return false;
    
    if (item.children) {
      // For parent items, check if any child should be visible
      const visibleChildren = item.children.filter(child => {
        if (child.id === 'secretaries') return false;
        const childKeys = secretaryPermissionMap[child.id];
        if (!childKeys || childKeys.length === 0) return false;
        return childKeys.some(key => userPermKeys.includes(key));
      }).map(updateItemLabel);
      
      return visibleChildren.length > 0;
    }
    
    return requiredKeys.some(key => userPermKeys.includes(key));
  }).map(item => {
    const updatedItem = updateItemLabel(item);
    if (updatedItem.children) {
      updatedItem.children = updatedItem.children.filter(child => {
        if (child.id === 'secretaries') return false;
        const childKeys = secretaryPermissionMap[child.id];
        if (!childKeys || childKeys.length === 0) return false;
        return childKeys.some(key => userPermKeys.includes(key));
      }).map(updateItemLabel);
    }
    return updatedItem;
  });
};

export const Navbar: React.FC<NavbarProps> = ({ role, user: userProp, onMenuClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user: authUser, selectedAcademy, isLoading } = useAuth();
  
  // Use authUser from context if available, otherwise fall back to prop
  const user = authUser || userProp;
  const { selectedTeacher } = useAuth();
  
  // Get nav items and filter for secretary
  let items = role === 'parent' ? getParentNavItems() : getNavItems(role);

  // Filter items for Video Addon
  const hasVideosAddon = (function() {
    if (role === 'academy') {
      return (user as any)?.has_videos_addon;
    }
    
    if (role === 'teacher') {
      const isIndependent = selectedAcademy?.id === 'independent' || (!selectedAcademy?.id && !isLoading);
      if (isIndependent) {
        return (user as any)?.has_videos_addon;
      }
      return selectedAcademy?.has_videos_addon;
    }
    
    if (role === 'secretary') {
      const isIndependent = selectedAcademy?.id === 'independent' || (!selectedAcademy?.id && !isLoading);
      if (isIndependent) {
          if (selectedAcademy?.id && selectedAcademy.id !== 'independent') {
              return selectedAcademy.has_videos_addon;
          }
          return (user as any)?.has_videos_addon ?? true;
      }
      return selectedAcademy?.has_videos_addon;
    }

    if (role === 'student') {
      return selectedTeacher?.has_videos_addon;
    }

    return true;
  })();

  if (!hasVideosAddon) {
    items = items.filter(item => item.id !== 'videos');
  }

  if (role === 'secretary' && authUser?.permissions) {
    items = filterNavItemsByPermissions(items, authUser.permissions);
  } else if (role === 'secretary') {
    // No permissions = only dashboard
    items = items.filter(item => item.id === 'dashboard');
  }
  
  if (role === 'teacher') {
    const isAcademyMode = (selectedAcademy?.id && selectedAcademy.id !== 'independent') || isLoading;
    
    if (isAcademyMode) {
      items = items
        .filter(item => item.id !== 'reports') // Remove Reports
        .map(item => {
          if (item.id === 'question_bank') {
            return { ...item, href: '/academy/questions' };
          }
          if (item.children) {
            return {
              ...item,
              children: item.children.filter(child => 
                child.id !== 'secretaries' && // Remove Secretary
                child.id !== 'grades'         // Remove Grades (Classes)
              )
            };
          }
          return item;
        });
    } else {
      items = items.filter(item => item.id !== 'attendance');
    }
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasAcademies, setHasAcademies] = useState(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isScanAttendanceModalOpen, setIsScanAttendanceModalOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAcademies = async () => {
      if (role === 'teacher' && !isLoading && authUser?.userType === 'teacher') {
        try {
          const response = await getTeacherAcademies();
          const academiesList = response.academies || [];
          setHasAcademies(academiesList.length > 0);
        } catch (error) {
          console.error('Failed to check academies:', error);
          setHasAcademies(false);
        }
      }
    };

    checkAcademies();
  }, [role, isLoading, authUser]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setActiveSubMenu(null);
      }
    };

    if (isDropdownOpen || activeSubMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, activeSubMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
    if (onMenuClick) onMenuClick();
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className={`relative premium-glass premium-border rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between shadow-2xl transition-all duration-500 ${isScrolled ? 'bg-black/60 backdrop-blur-3xl' : 'bg-black/20'}`}>
            
            {/* Background Glow (Desktop Only) */}
            <div className="absolute top-0 left-1/4 w-64 h-full bg-primary/5 blur-3xl rounded-full -translate-y-1/2 pointer-events-none hidden md:block"></div>

            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div 
                className="relative cursor-pointer group"
                onClick={() => router.push(`/${role}/dashboard`)}
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img src="/logo.png" alt="Logo" className="relative h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" />
              </div>
            </div>

            {/* Desktop Navigation Links - REMOVED per user request to use sidebar only */}
            
            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              
              {/* Teacher Selector (Student Only) */}
              {role === 'student' && (
                <TeacherSelectionDropdown />
              )}

              {/* Action Buttons Group */}
              <div className="flex items-center gap-1 md:gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-light/40 hover:text-primary hover:bg-white/10 transition-all relative group"
                  title="طباعة"
                >
                  <Icon name="print" />
                </button>

                {/* Upload Manager & Notifications */}
                <NavbarUploadManager />
                <NotificationDropdown role={role} />
              </div>

              {/* User Profile */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-3 p-1.5 md:p-2 rounded-2xl transition-all border ${
                    isDropdownOpen ? 'bg-primary/10 border-primary/20' : 'bg-surface-secondary border-border-theme-secondary hover:border-border-theme-primary'
                  }`}
                >
                  <div className="relative">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary to-purple-600 p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-[0.6rem] bg-surface-secondary overflow-hidden flex items-center justify-center text-xs font-black text-text-theme-primary">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          user ? getInitials(user.name) : 'U'
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-surface-primary rounded-full shadow-lg"></div>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-start pr-1">
                    <span className="text-sm font-black text-text-theme-primary leading-tight truncate max-w-[120px]">{user?.name?.split(' ')[0]}</span>
                    <span className="text-[10px] font-bold text-text-theme-muted/50">نشط الآن</span>
                  </div>
                  
                  <Icon 
                    name="chevron-down" 
                    size="xs" 
                    className={`text-text-theme-muted/50 transition-transform duration-300 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full mt-4 left-0 w-64 bg-surface-primary border border-border-theme-primary rounded-[2.5rem] p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 z-[110]">
                    <div className="p-4 mb-2 bg-surface-secondary rounded-2xl border border-border-theme-secondary">
                      <p className="text-xs font-black text-text-theme-muted/40 uppercase tracking-widest mb-1">الحساب الحالي</p>
                      <p className="text-sm font-black text-text-theme-primary truncate">{user?.name}</p>
                      <p className="text-[10px] font-bold text-primary/60">{user?.email || getRoleLabel(role)}</p>
                    </div>

                    <div className="space-y-1">
                      <Link 
                        href={`/${role}/profile`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-text-theme-secondary hover:text-text-theme-primary hover:bg-surface-hover transition-all"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Icon name="user" className="text-primary" />
                        <span>الملف الشخصي</span>
                      </Link>

                      {role === 'student' && (
                        <Link
                          href="/student/achievements"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-light/60 hover:text-white hover:bg-white/5 transition-all"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Icon name="medal" className="text-amber-400" />
                          <span>إنجازاتي</span>
                        </Link>
                      )}

                      {role === 'teacher' && (
                        <Link
                          href="/teacher/subscription"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-light/60 hover:text-white hover:bg-white/5 transition-all"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Icon name="crown" className="text-amber-400" />
                          <span>اشتراكي</span>
                        </Link>
                      )}

                      {hasAcademies && (
                        <button
                          onClick={() => {
                            setIsAcademyModalOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-light/60 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Icon name="exchange-alt" className="text-primary" />
                          <span>تبديل الأكاديمية / مستقل</span>
                        </button>
                      )}

                      <div className="h-px bg-white/5 my-2 mx-2"></div>

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Icon name="sign-out-alt" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Toggle - Hidden on mobile, as navigation is now in Bottom Nav */}
              {role !== 'parent' && (
                <button 
                  onClick={toggleMobileSidebar}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl items-center justify-center bg-white/5 border border-white/5 text-gray-light/40 hover:text-primary transition-all hidden lg:flex"
                >
                  <Icon name="bars" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Universal Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-[300px] bg-surface-primary border-r border-border-theme-primary z-[200] transition-transform duration-500 ease-out ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-bottom border-border-theme-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[0.6rem] bg-surface-secondary overflow-hidden flex items-center justify-center text-xs font-black text-text-theme-primary">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    user ? getInitials(user.name) : 'U'
                  )}
                </div>
             </div>
             <div>
                <p className="text-sm font-black text-text-theme-primary leading-tight">{user?.name?.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-gray-light/30">{getRoleLabel(role)}</p>
             </div>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-light/40 hover:text-rose-400 transition-colors"
          >
            <Icon name="times" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id}>
                {item.children ? (
                  <div className="mb-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl text-gray-light/60 font-bold hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Icon name={item.icon as any} className="text-primary" />
                        <span>{item.label}</span>
                      </div>
                      <Icon name="chevron-down" size="xs" />
                    </button>
                    
                    <div className="mt-1 mr-4 border-r border-white/5 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold transition-all ${
                            pathname === child.href ? 'text-primary bg-primary/5' : 'text-gray-light/40 hover:text-white'
                          }`}
                        >
                          <Icon name={child.icon as any} size="sm" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                      pathname === item.href ? 'text-white bg-primary shadow-lg shadow-primary/20' : 'text-gray-light/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name={item.icon as any} />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-3 p-4 rounded-2xl font-black text-rose-400 hover:bg-rose-500/10 transition-all"
             >
               <Icon name="sign-out-alt" />
               <span>تسجيل الخروج</span>
             </button>
          </div>
        </div>
      </div>

      {/* Academy Selector Modal */}
      <AcademySelector 
        isOpen={isAcademyModalOpen}
        onClose={() => setIsAcademyModalOpen(false)}
      />

      {/* Scan Attendance Modal */}
      <ScanAttendanceModal
        isOpen={isScanAttendanceModalOpen}
        onClose={() => setIsScanAttendanceModalOpen(false)}
      />
    </>
  );
};
