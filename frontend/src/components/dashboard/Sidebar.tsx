'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarItem } from '@/types/dashboard';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'student';
  user: {
    name: string;
    avatar?: string;
  };
  isOpen: boolean;
  onClose: () => void;
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
        ],
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
  };
  return labels[role] || role;
};

export const Sidebar: React.FC<SidebarProps> = ({ role, user, isOpen, onClose }) => {
  const pathname = usePathname();
  const items = getSidebarItems(role);
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
