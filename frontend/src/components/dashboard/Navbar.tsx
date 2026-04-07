'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { SidebarItem } from '@/types/dashboard';
import { NotificationDropdown } from './NotificationDropdown';
import { TeacherSelectionDropdown } from './TeacherSelectionDropdown';
import { AcademySelector } from './AcademySelector';
import ScanAttendanceModal from './ScanAttendanceModal';
import { getTeacherAcademies } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';


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
      href: `/${role}/dashboard`,
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
        id: 'notifications',
        label: 'الإخطارات',
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

// Map menu items to required permissions for secretary - STRICT MODE
// Each menu item must have at least ONE matching permission to be visible
const secretaryPermissionMap: Record<string, string[]> = {
  // Dashboard - always visible, no permission needed
  dashboard: [],
  
  // Persons section
  persons: ['view students', 'create students', 'edit students', 'delete students', 'manage student groups'],
  students: ['view students', 'create students', 'edit students', 'delete students', 'manage student groups'],
  secretaries: [], // Never visible to secretary
  
  // Academics section
  academics: ['view groups', 'create groups', 'edit groups', 'delete groups', 'view grades', 'create grades', 'edit grades', 'delete grades'],
  groups: ['view groups', 'create groups', 'edit groups', 'delete groups'],
  grades: ['view grades', 'create grades', 'edit grades', 'delete grades'],
  
  // Lectures
  lectures: ['view lectures', 'create lectures', 'edit lectures', 'delete lectures', 'manage lecture attendance'],
  videos: ['view videos', 'create videos', 'edit videos', 'delete videos', 'publish videos', 'manage video comments'],
  
  // Exams
  exams: ['view exams', 'create exams', 'edit exams', 'delete exams', 'grade exams'],
  
  // Notifications
  notifications: ['send notifications'],
  
  // Gamification / Leaderboard
  gamification: ['view dashboard', 'view reports'],
  
  // Reports
  reports: ['view reports'],
};

const filterNavItemsByPermissions = (items: SidebarItem[], permissions: string[]): SidebarItem[] => {
  return items.filter(item => {
    // Dashboard is always visible
    if (item.id === 'dashboard') return true;
    
    // Secretaries can NEVER be visible to a secretary
    if (item.id === 'secretaries') return false;
    
    const requiredPerms = secretaryPermissionMap[item.id];
    
    // If no permission mapping exists for this item, hide it (STRICT)
    if (!requiredPerms || requiredPerms.length === 0) return false;
    
    if (item.children) {
      // For parent items, check if any child should be visible
      const visibleChildren = item.children.filter(child => {
        if (child.id === 'secretaries') return false;
        const childPerms = secretaryPermissionMap[child.id];
        // STRICT: Must have at least one matching permission
        if (!childPerms || childPerms.length === 0) return false;
        return childPerms.some(perm => permissions.includes(perm));
      });
      return visibleChildren.length > 0;
    }
    
    // STRICT: Check if user has at least ONE of the required permissions
    return requiredPerms.some(perm => permissions.includes(perm));
  }).map(item => {
    if (item.children) {
      const visibleChildren = item.children.filter(child => {
        if (child.id === 'secretaries') return false;
        const childPerms = secretaryPermissionMap[child.id];
        if (!childPerms || childPerms.length === 0) return false;
        return childPerms.some(perm => permissions.includes(perm));
      });
      return { ...item, children: visibleChildren };
    }
    return item;
  });
};

export const Navbar: React.FC<NavbarProps> = ({ role, user: userProp, onMenuClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user: authUser, selectedAcademy, isLoading } = useAuth();
  
  // Use authUser from context if available, otherwise fall back to prop
  const user = authUser || userProp;
  
  // Get nav items and filter for secretary
  let items = role === 'parent' ? getParentNavItems() : getNavItems(role);
  if (role === 'secretary' && authUser?.permissions) {
    items = filterNavItemsByPermissions(items, authUser.permissions);
  } else if (role === 'secretary') {
    // No permissions = only dashboard
    items = items.filter(item => item.id === 'dashboard');
  }

  // Filter items for Academy mode (Teacher only)
  // If selectedAcademy has an ID, it means the teacher is in "Academy Dashboard" mode
  // OR if we are still loading (isLoading is true), we default to "Restricted" mode to prevent flicker
  // In this mode, they should NOT see: Secretary, Grades (Classes), Reports
  // They SHOULD see: Attendance (only in Academy Mode)
  // Filter items for Academy mode (Teacher only)
  // If selectedAcademy has an ID, it means the teacher is in "Academy Dashboard" mode
  // OR if we are still loading (isLoading is true), we default to "Restricted" mode to prevent flicker
  
  if (role === 'teacher' && (selectedAcademy?.id || isLoading)) {
    if (selectedAcademy?.id === 'independent') {
      // Independent Teacher Mode
      // Remove Attendance (not needed for independent)
      items = items.filter(item => item.id !== 'attendance');
    } else {
      // Academy Teacher Mode (or loading)
      // They should NOT see: Secretary, Grades (Classes), Reports
      // They SHOULD see: Attendance
      items = items
        .filter(item => item.id !== 'reports' && item.id !== 'videos') // Remove Reports and Videos
        .map(item => {
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
    }
  }

  if (role === 'teacher' && selectedAcademy?.id !== 'independent') {
    items = items.filter(item => item.id !== 'videos');
  }
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileExpandedItems, setMobileExpandedItems] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isScanAttendanceModalOpen, setIsScanAttendanceModalOpen] = useState(false);
  const [hasAcademies, setHasAcademies] = useState(false);
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

  const toggleMobileExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
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
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <img src="/logo.png" alt="منصة التعليم" className="ux-h-12 ux-w-auto ux-object-contain" />
            <div className="navbar-logo-text">
              <span>{getRoleLabel(role)}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="navbar-links" ref={navDropdownRef}>
            {items.map((item) => (
              item.children ? (
                <div key={item.id} className="navbar-item-dropdown-container">
                  <Button
                    variant="ghost"
                    className={`navbar-link navbar-link-button ${pathname.startsWith(item.href) ? 'active' : ''}`}
                    onClick={() => setActiveSubMenu(activeSubMenu === item.id ? null : item.id)}
                  >
                    <Icon name={item.icon as any} size="sm" />
                    <span>{item.label}</span>
                    <Icon 
                      name="chevron-down" 
                      size="sm" 
                      className={`navbar-chevron ${activeSubMenu === item.id ? 'rotate-180' : ''}`}
                    />
                  </Button>
                  
                  {activeSubMenu === item.id && (
                    <div className="navbar-dropdown navbar-dropdown-menu">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`navbar-dropdown-item ${pathname === child.href ? 'active' : ''}`}
                          onClick={() => setActiveSubMenu(null)}
                        >
                          <Icon name={child.icon as any} size="sm" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`navbar-link ${pathname === item.href ? 'active' : ''}`}
                >
                  <Icon name={item.icon as any} size="sm" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="navbar-badge">{item.badge}</span>
                  )}
                </Link>
              )
            ))}
          </div>

          {/* Right Side Group: Notifications + User + Mobile Toggle */}
          <div className="navbar-right-group">

            {/* Teacher Selector (Student Only) */}
            {role === 'student' && (
              <TeacherSelectionDropdown />
            )}

            {/* Scan Attendance Button (Teacher in Academy Mode Only) */}
            {role === 'teacher' && selectedAcademy?.id && selectedAcademy.id !== 'independent' && (
              <Button
                variant="ghost"
                onClick={() => setIsScanAttendanceModalOpen(true)}
                className="navbar-scan-btn"
                title="تسجيل الحضور والانصراف"
              >
                <Icon name="qrcode" size="sm" />
                <span className="ux-hidden ux-lg-inline">تسجيل الحضور</span>
              </Button>
            )}

            {/* Notification Dropdown */}
            <NotificationDropdown role={role} />

            {/* User Menu */}
            <div className="navbar-user" ref={dropdownRef}>
              <div 
                className="navbar-user-clickable"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="navbar-user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    user ? getInitials(user.name) : 'U'
                  )}
                </div>
                <div className="navbar-user-info">
                  <p className="navbar-user-name">{user?.name || ''}</p>
                  {role === 'teacher' && selectedAcademy && (
                    <p className="ux-text-xs ux-text-gray-500 ux-dark-text-gray-400">
                      {selectedAcademy.name}
                    </p>
                  )}
                </div>
                <span
                  className={`navbar-user-chevron ${isDropdownOpen ? 'open' : ''}`}
                >
                  <Icon name="chevron-down" size="sm" />
                </span>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="navbar-dropdown">
                  <Link 
                    href={`/${role}/profile`}
                    className="navbar-dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Icon name="user" size="sm" />
                    <span>الملف الشخصي</span>
                  </Link>

                  {role === 'student' && (
                    <Link
                      href="/student/achievements"
                      className="navbar-dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Icon name="medal" size="sm" />
                      <span>إنجازاتي</span>
                    </Link>
                  )}
                  
                  {/* Subscription Link - Only for academy role or independent teachers */}
                  {(role === 'academy' || (role === 'teacher' && (!selectedAcademy?.id || selectedAcademy.id === 'independent'))) && (
                    <Link
                      href={
                        role === 'academy' ? '/academy/subscription' :
                        '/teacher/subscription'
                      }
                      className="navbar-dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Icon name="id-card" size="sm" />
                      <span>
                        {role === 'academy' ? 'الاشتراك' : 'اشتراكي'}
                      </span>
                    </Link>
                  )}
                  
                  {/* Academy Selector for Teachers */}
                  {role === 'teacher' && hasAcademies && (
                    <>
                      <div className="navbar-dropdown-divider"></div>
                      <Button 
                        variant="ghost"
                        className="navbar-dropdown-item ux-w-full ux-justify-start"
                        onClick={() => {
                          console.log('Opening academy modal');
                          setIsAcademyModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Icon name="building" size="sm" />
                        <span>تغيير الأكاديمية</span>
                      </Button>
                    </>
                  )}
                  
                  <div className="navbar-dropdown-divider"></div>
                  <Button 
                    variant="ghost"
                    className="navbar-dropdown-item logout-item navbar-logout-btn ux-w-full ux-justify-start"
                    onClick={handleLogout}
                  >
                    <Icon name="sign-out-alt" size="sm" />
                    <span>تسجيل الخروج</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            {role !== 'parent' && (
              <Button 
                variant="ghost"
                size="sm"
                className="navbar-menu-toggle"
                onClick={toggleMobileSidebar}
              >
                <Icon name="bars" />
              </Button>
            )}
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

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-user">
            <div className="mobile-sidebar-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                user ? getInitials(user.name) : 'U'
              )}
            </div>
            <div className="mobile-sidebar-user-info">
              <p className="mobile-sidebar-user-name">{user?.name || ''}</p>
            </div>
          </div>
          <Button 
            variant="ghost"
            size="sm"
            className="mobile-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <Icon name="times" />
          </Button>
        </div>

        <div className="mobile-sidebar-nav">
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {item.children ? (
                <div className={`mobile-sidebar-group ${mobileExpandedItems.includes(item.id) ? 'expanded' : ''}`}>
                  <div 
                    className="mobile-sidebar-group-title" 
                    onClick={(e) => toggleMobileExpand(item.id, e)}
                  >
                    <div className="group-content">
                      <Icon name={item.icon as any} size="sm" />
                      <span>{item.label}</span>
                    </div>
                    <Icon name="chevron-down" size="sm" className="chevron" />
                  </div>
                  <div className="mobile-sidebar-group-children">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`mobile-sidebar-sublink ${pathname === child.href ? 'active' : ''}`}
                        onClick={() => setIsMobileSidebarOpen(false)}
                      >
                        <Icon name={child.icon as any} size="sm" />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`mobile-sidebar-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <Icon name={item.icon as any} size="sm" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="mobile-sidebar-badge">{item.badge}</span>
                  )}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mobile-sidebar-footer">
          <Link 
            href={`/${role}/profile`}
            className="mobile-sidebar-link"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <Icon name="user" size="sm" />
            <span>الملف الشخصي</span>
          </Link>

          {role === 'student' && (
            <Link
              href="/student/achievements"
              className="mobile-sidebar-link"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <Icon name="medal" size="sm" />
              <span>إنجازاتي</span>
            </Link>
          )}
          <Button 
            variant="ghost"
            className="mobile-sidebar-link ux-w-full ux-justify-start"
            onClick={() => {
              setIsMobileSidebarOpen(false);
              handleLogout();
            }}
          >
            <Icon name="sign-out-alt" size="sm" />
            <span>تسجيل الخروج</span>
          </Button>
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
