'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarItem } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'student' | 'secretary';
  user: {
    name: string;
    avatar?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  permissions?: string[];
}

const getSidebarItems = (role: string): SidebarItem[] => {
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
        id: 'users',
        label: 'المستخدمين',
        icon: 'fas fa-users',
        href: '#',
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
          {
            id: 'academies_list',
            label: 'الأكاديميات',
            icon: 'fas fa-building',
            href: '/admin/academies',
          },

        ],
      },
      {
        id: 'reports',
        label: 'التقارير',
        icon: 'fas fa-chart-line',
        href: '/admin/reports',
      },
      {
        id: 'access_control',
        label: 'الصلاحيات',
        icon: 'fas fa-shield-alt',
        href: '#',
        children: [
          {
            id: 'permissions',
            label: 'الصلاحيات',
            icon: 'fas fa-key',
            href: '/admin/permissions',
          },
          {
            id: 'roles',
            label: 'الادوار',
            icon: 'fas fa-user-tag',
            href: '/admin/roles',
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
        id: 'settings',
        label: 'الإعدادات',
        icon: 'fas fa-cogs',
        href: '/admin/settings',
      },
    ];
  }

  if (role === 'teacher') {
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
        id: 'attendance',
        label: 'الحضور',
        icon: 'fas fa-qrcode',
        href: '/teacher/attendance',
      },
      {
        id: 'reports',
        label: 'التقارير',
        icon: 'fas fa-chart-line',
        href: '/teacher/reports',
      },
    ];
  }

  // Student
  return [
    ...commonItems,
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
      id: 'mistakes',
      label: 'أخطائي',
      icon: 'fas fa-exclamation-circle',
      href: '/student/mistakes',
    },
    {
      id: 'leaderboard',
      label: 'لوحة الشرف',
      icon: 'fas fa-trophy',
      href: '/student/leaderboard',
    },
  ];
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'مدير النظام',
    teacher: 'مدرس',
    student: 'طالب',
    secretary: 'سكرتير',
  };
  return labels[role] || role;
};

// Map menu items to required permissions
const permissionMap: Record<string, string[]> = {
  students: ['view students', 'create students', 'edit students', 'delete students'],
  secretaries: [], // Secretaries cannot manage other secretaries
  groups: ['view groups', 'create groups', 'edit groups', 'delete groups'],
  grades: ['view grades', 'create grades', 'edit grades', 'delete grades'],
  lectures: ['view lectures', 'create lectures', 'edit lectures', 'delete lectures'],
  exams: ['view exams', 'create exams', 'edit exams', 'delete exams'],
  notifications: ['send notifications'],
  attendance: ['manage lecture attendance'],
  reports: ['view reports'],
  dashboard: ['view dashboard'],
};

const filterItemsByPermissions = (items: SidebarItem[], permissions: string[]): SidebarItem[] => {
  return items.filter(item => {
    // Dashboard is always visible
    if (item.id === 'dashboard') return true;
    
    // Check if user has ANY of the required permissions for this menu
    const requiredPerms = permissionMap[item.id] || [];
    if (requiredPerms.length === 0 && !item.children) return false;
    
    const hasPermission = requiredPerms.some(perm => permissions.includes(perm));
    
    if (item.children) {
      // For parent items, check if any child should be visible
      const visibleChildren = item.children.filter(child => {
        const childPerms = permissionMap[child.id] || [];
        return childPerms.some(perm => permissions.includes(perm));
      });
      if (visibleChildren.length > 0) {
        return { ...item, children: visibleChildren };
      }
      return false;
    }
    
    return hasPermission;
  }).map(item => {
    if (item.children) {
      const visibleChildren = item.children.filter(child => {
        const childPerms = permissionMap[child.id] || [];
        return childPerms.some(perm => permissions.includes(perm));
      });
      return { ...item, children: visibleChildren };
    }
    return item;
  });
};



export const Sidebar: React.FC<SidebarProps> = ({ role, user, isOpen, onClose, permissions = [] }) => {
  const pathname = usePathname();
  const { selectedAcademy, isLoading } = useAuth();
  
  // Get items based on role, then filter by permissions for secretary
  let items = getSidebarItems(role === 'secretary' ? 'teacher' : role);
  
  if (role === 'secretary' && permissions.length > 0) {
    items = filterItemsByPermissions(items, permissions);
  } else if (role === 'secretary') {
    // No permissions = only dashboard
    items = items.filter(item => item.id === 'dashboard');
  }

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
        .filter(item => item.id !== 'reports') // Remove Reports
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

  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedItems((prev) =>
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

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className="sidebar-logo-text">
              <h2>منصة التعليم</h2>
              <p>{getRoleLabel(role)}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-title">القائمة الرئيسية</div>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.children ? (
                  <div className={`sidebar-nav-group ${expandedItems.includes(item.id) ? 'expanded' : ''}`}>
                    <a
                      href="#"
                      className={`sidebar-nav-item ${expandedItems.includes(item.id) ? 'active' : ''}`}
                      onClick={(e) => toggleExpand(item.id, e)}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                      <i className={`fas fa-chevron-down ms-auto sidebar-chevron ${expandedItems.includes(item.id) ? 'rotate-180' : ''}`}></i>
                    </a>
                    <div className="sidebar-nav-children">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`sidebar-nav-item sidebar-nav-child-item ${pathname === child.href ? 'active' : ''}`}
                          onClick={onClose}
                        >
                          <i className={`sidebar-nav-child-icon ${child.icon}`}></i>
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.name}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
