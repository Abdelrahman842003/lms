'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarItem } from '@/types/dashboard';
import { NotificationDropdown } from './NotificationDropdown';
import { TeacherSelectionDropdown } from './TeacherSelectionDropdown';

interface NavbarProps {
  role: 'admin' | 'teacher' | 'student' | 'secretary' | 'parent';
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
      icon: 'fas fa-home',
      href: `/${role}/dashboard`,
    },
  ];

  if (role === 'admin') {
    return [
      ...commonItems,
      {
        id: 'users_management',
        label: 'المستخدمين',
        icon: 'fas fa-users-cog',
        href: '/admin/users-management',
        children: [
          {
            id: 'teachers',
            label: 'المدرسين',
            icon: 'fas fa-chalkboard-teacher',
            href: '/admin/teachers',
          },

          {
            id: 'students',
            label: 'الطلاب',
            icon: 'fas fa-user-graduate',
            href: '/admin/students',
          },
        ],
      },

      {
        id: 'notifications',
        label: 'الإخطارات',
        icon: 'fas fa-bell',
        href: '/admin/notifications',
      },
      {
        id: 'reports',
        label: 'التقارير',
        icon: 'fas fa-chart-bar',
        href: '/admin/reports',
      },
      {
        id: 'users',
        label: 'الصلاحيات',
        icon: 'fas fa-users',
        href: '/admin/users',
        children: [
          {
            id: 'roles',
            label: 'الأدوار (Roles)',
            icon: 'fas fa-user-tag',
            href: '/admin/roles',
          },
          {
            id: 'permissions',
            label: 'الصلاحيات (Permissions)',
            icon: 'fas fa-key',
            href: '/admin/permissions',
          },
        ],
      },
      {
        id: 'settings',
        label: 'الإعدادات',
        icon: 'fas fa-cogs',
        href: '/admin/settings',
      },
    ];
  }

  if (role === 'teacher' || role === 'secretary') {
    return [
      ...commonItems,
      {
        id: 'persons',
        label: 'الاشخاص',
        icon: 'fas fa-users',
        href: '#',
        children: [
          {
            id: 'students',
            label: 'الطلاب',
            icon: 'fas fa-user-graduate',
            href: '/teacher/students',
          },
          {
            id: 'secretaries',
            label: 'السكرتارية',
            icon: 'fas fa-user-tie',
            href: '/teacher/secretaries',
          },

        ],
      },
      {
        id: 'academics',
        label: 'الدراسة',
        icon: 'fas fa-school',
        href: '#',
        children: [
          {
            id: 'groups',
            label: 'المجموعات',
            icon: 'fas fa-layer-group',
            href: '/teacher/groups',
          },
          {
            id: 'grades',
            label: 'الصفوف',
            icon: 'fas fa-graduation-cap',
            href: '/teacher/grades',
          },
        ],
      },
      {
        id: 'lectures',
        label: 'المحاضرات',
        icon: 'fas fa-book-open',
        href: '/teacher/lectures',
      },

      {
        id: 'exams',
        label: 'الامتحانات',
        icon: 'fas fa-file-alt',
        href: '/teacher/exams',
      },
      {
        id: 'notifications',
        label: 'الإخطارات',
        icon: 'fas fa-bell',
        href: '/teacher/notifications',
      },
      {
        id: 'gamification',
        label: 'لوحة الشرف',
        icon: 'fas fa-trophy',
        href: '/teacher/gamification',
      },
      {
        id: 'reports',
        label: 'التقارير',
        icon: 'fas fa-chart-bar',
        href: '/teacher/reports',
      },

    ];
  }

  // Student
  return [
    ...commonItems,
    {
      id: 'leaderboard',
      label: 'لوحة الشرف',
      icon: 'fas fa-trophy',
      href: '/student/leaderboard',
    },
    {
      id: 'mistakes',
      label: 'أخطائي',
      icon: 'fas fa-exclamation-circle',
      href: '/student/mistakes',
    },
    {
      id: 'lectures',
      label: 'المحاضرات',
      icon: 'fas fa-book-open',
      href: '/student/lectures',
    },
    {
      id: 'exams',
      label: 'الامتحانات',
      icon: 'fas fa-file-alt',
      href: '/student/exams',
    },
    {
      id: 'notifications',
      label: 'الإخطارات والدعم',
      icon: 'fas fa-bell',
      href: '/student/notifications',
    },
  ];
};

const getParentNavItems = (): SidebarItem[] => {
  return [];
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'مدير النظام',
    teacher: 'مدرس',
    student: 'طالب',
    secretary: 'سكرتير',
    parent: 'ولي أمر',
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

export const Navbar: React.FC<NavbarProps> = ({ role, user, onMenuClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user: authUser } = useAuth();
  
  // Get nav items and filter for secretary
  let items = role === 'parent' ? getParentNavItems() : getNavItems(role);
  if (role === 'secretary' && authUser?.permissions) {
    items = filterNavItemsByPermissions(items, authUser.permissions);
  } else if (role === 'secretary') {
    // No permissions = only dashboard
    items = items.filter(item => item.id === 'dashboard');
  }
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileExpandedItems, setMobileExpandedItems] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

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
            <img src="/logo.png" alt="منصة التعليم" className="h-12 w-auto object-contain" />
            <div className="navbar-logo-text">
              <span>{getRoleLabel(role)}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="navbar-links" ref={navDropdownRef}>
            {items.map((item) => (
              item.children ? (
                <div key={item.id} className="navbar-item-dropdown-container">
                  <button
                    className={`navbar-link navbar-link-button ${pathname.startsWith(item.href) ? 'active' : ''}`}
                    onClick={() => setActiveSubMenu(activeSubMenu === item.id ? null : item.id)}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                    <i className={`fas fa-chevron-down navbar-chevron ${activeSubMenu === item.id ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {activeSubMenu === item.id && (
                    <div className="navbar-dropdown navbar-dropdown-menu">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`navbar-dropdown-item ${pathname === child.href ? 'active' : ''}`}
                          onClick={() => setActiveSubMenu(null)}
                        >
                          <i className={child.icon}></i>
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
                  <i className={item.icon}></i>
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
                </div>
                <i className={`fas fa-chevron-down navbar-user-chevron`} style={{ 
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}></i>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="navbar-dropdown">
                  <Link 
                    href={`/${role}/profile`}
                    className="navbar-dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <i className="fas fa-user"></i>
                    <span>الملف الشخصي</span>
                  </Link>
                  <div className="navbar-dropdown-divider"></div>
                  <button 
                    className="navbar-dropdown-item logout-item navbar-logout-btn"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            {role !== 'parent' && (
              <button className="navbar-menu-toggle" onClick={toggleMobileSidebar}>
                <i className="fas fa-bars"></i>
              </button>
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
          <button 
            className="mobile-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
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
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </div>
                    <i className="fas fa-chevron-down chevron"></i>
                  </div>
                  <div className="mobile-sidebar-group-children">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`mobile-sidebar-sublink ${pathname === child.href ? 'active' : ''}`}
                        onClick={() => setIsMobileSidebarOpen(false)}
                      >
                        <i className={child.icon}></i>
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
                  <i className={item.icon}></i>
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
            <i className="fas fa-user"></i>
            <span>الملف الشخصي</span>
          </Link>
          <button 
            className="mobile-sidebar-link"
            onClick={() => {
              setIsMobileSidebarOpen(false);
              handleLogout();
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};
