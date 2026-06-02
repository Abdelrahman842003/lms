'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarItem } from '@/types/dashboard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { Icon } from '@/components/ui';

interface SidebarProps {
  role: 'teacher' | 'student' | 'secretary';
  user: {
    name: string;
    avatar?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  permissions?: any[];
}

const getSidebarItems = (role: string): SidebarItem[] => {
  const commonItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: 'fas fa-home',
      href: role === 'secretary' ? '/teacher/dashboard' : `/${role}/dashboard`,
    },
  ];

  if (role === 'teacher') {
    return [
      ...commonItems,
      {
        id: 'subscription',
        label: 'اشتراكي',
        icon: 'fas fa-id-card',
        href: '/teacher/subscription',
      },
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
        id: 'videos',
        label: 'الفيديوهات التعليمية',
        icon: 'fas fa-film',
        href: '/teacher/videos',
      },

      {
        id: 'exams',
        label: 'الامتحانات',
        icon: 'fas fa-file-alt',
        href: '/teacher/exams',
      },
      {
        id: 'question_bank',
        label: 'بنك الأسئلة',
        icon: 'fas fa-database',
        href: '/teacher/questions',
      },
      {
        id: 'notes',
        label: 'المذكرات',
        icon: 'fas fa-file-pdf',
        href: '/teacher/notes',
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
        id: 'gamification',
        label: 'لوحة الشرف',
        icon: 'fas fa-trophy',
        href: '/teacher/gamification',
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
      id: 'videos',
      label: 'الفيديوهات التعليمية',
      icon: 'fas fa-film',
      href: '/student/videos',
    },
    {
      id: 'exams',
      label: 'الامتحانات',
      icon: 'fas fa-file-alt',
      href: '/student/exams',
    },
    {
      id: 'self-test',
      label: 'اختبر نفسك',
      icon: 'fas fa-vial',
      href: '/student/self-test',
    },
    {
      id: 'notes',
      label: 'مذكراتي',
      icon: 'fas fa-file-pdf',
      href: '/student/notes',
    },
    {
      id: 'mistakes',
      label: 'أخطائي',
      icon: 'fas fa-exclamation-circle',
      href: '/student/mistakes',
    },
    {
      id: 'code-lab',
      label: 'معمل الأكواد',
      icon: 'fas fa-code',
      href: '/student/code-lab',
    },
  ];
};


const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    teacher: 'مدرس',
    student: 'طالب',
    secretary: 'سكرتير',
  };
  return labels[role] || role;
};

// Map menu items to required feature keys or permission names
const permissionMap: Record<string, string[]> = {
  students: ['students', 'view students', 'create students', 'edit students', 'delete students'],
  secretaries: ['secretaries'], // Now a secretary can see this if granted the 'secretaries' key
  groups: ['groups', 'view groups', 'create groups', 'edit groups', 'delete groups'],
  grades: ['grades', 'view grades', 'create grades', 'edit grades', 'delete grades'],
  lectures: ['lectures', 'lessons', 'view lectures', 'create lectures', 'edit lectures', 'delete lectures'],
  videos: ['videos', 'courses', 'levels', 'content_mgmt', 'view videos', 'create videos', 'edit videos', 'delete videos', 'publish videos'],
  exams: ['exams', 'exams_mgmt', 'view exams', 'create exams', 'edit exams', 'delete exams'],
  question_bank: ['exams', 'exams_mgmt', 'view exams', 'create exams', 'edit exams', 'delete exams'],
  notifications: ['notifications', 'send notifications'],
  attendance: ['attendance', 'manage lecture attendance'],
  reports: ['reports', 'stats', 'view reports'],
  dashboard: ['dashboard', 'view dashboard'],
  gamification: ['honor_roll', 'view dashboard'], // honor_roll is used for leaderboard
  'self-test': ['dashboard'], // Always visible for students
};

const filterItemsByPermissions = (items: SidebarItem[], permissions: any[]): SidebarItem[] => {
  const userPermKeys = permissions.map(p => typeof p === 'string' ? p : p.key);
  const userPermNames = permissions.reduce((acc: any, p) => {
    if (typeof p !== 'string') acc[p.key] = p.name;
    return acc;
  }, {});

  const updateItemLabel = (item: SidebarItem) => {
    const requiredKeys = permissionMap[item.id] || [];
    const matchingKey = requiredKeys.find(k => userPermNames[k]);
    if (matchingKey && userPermNames[matchingKey]) {
      return { ...item, label: userPermNames[matchingKey] };
    }
    return item;
  };

  return items.filter(item => {
    // Dashboard is always visible
    if (item.id === 'dashboard') return true;
    
    // Check if user has ANY of the required permissions for this menu
    const requiredKeys = permissionMap[item.id] || [];
    if (requiredKeys.length === 0 && !item.children) return false;
    
    const hasPermission = requiredKeys.some(key => userPermKeys.includes(key));
    
    if (item.children) {
      // For parent items, check if any child should be visible
      const visibleChildren = item.children.filter(child => {
        const childKeys = permissionMap[child.id] || [];
        return childKeys.some(key => userPermKeys.includes(key));
      }).map(updateItemLabel);
      
      if (visibleChildren.length > 0) {
        return true;
      }
      return false;
    }
    
    return hasPermission;
  }).map(item => {
    const updatedItem = updateItemLabel(item);
    if (updatedItem.children) {
      updatedItem.children = updatedItem.children.filter(child => {
        const childKeys = permissionMap[child.id] || [];
        return childKeys.some(key => userPermKeys.includes(key));
      }).map(updateItemLabel);
    }
    return updatedItem;
  });
};



export const Sidebar: React.FC<SidebarProps> = ({ role, user, isOpen, onClose, permissions = [] }) => {
  const pathname = usePathname();
  const { selectedAcademy, selectedTeacher, isLoading } = useAuth();
  
  // Get items based on role, then filter by permissions for secretary
  let items = getSidebarItems(role === 'secretary' || role === 'academy' ? 'teacher' : role);
  
  if (role === 'secretary' && permissions.length > 0) {
    items = filterItemsByPermissions(items, permissions);
  } else if (role === 'secretary') {
    // No permissions = only dashboard
    items = items.filter(item => item.id === 'dashboard');
  }

  // Filter items for Video Addon
  const hasVideosAddon = (function() {
    if (role === 'academy') {
      return (user as any).has_videos_addon;
    }
    
    if (role === 'teacher') {
      const isIndependent = selectedAcademy?.id === 'independent' || (!selectedAcademy?.id && !isLoading);
      if (isIndependent) {
        return (user as any).has_videos_addon;
      }
      return selectedAcademy?.has_videos_addon;
    }
    
    if (role === 'secretary') {
      // Secretary context is tied to a teacher
      const isIndependent = selectedAcademy?.id === 'independent' || (!selectedAcademy?.id && !isLoading);
      if (isIndependent) {
          // We don't have the teacher object directly here easily without more context, 
          // but usually the 'user' for secretary login contains relevant teacher info if it's a teacher-secretary.
          // However, secretaries are linked to teachers. Let's assume for now they follow the academy if set, or the first teacher.
          // Better: Check if they are in an academy context.
          if (selectedAcademy?.id && selectedAcademy.id !== 'independent') {
              return selectedAcademy.has_videos_addon;
          }
          // If independent teacher's secretary, we'd need teacher's flag.
          // For now, let's fall back to true to avoid breaking, or check user.has_videos_addon if passed.
          return (user as any).has_videos_addon ?? true;
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

  // Filter items for Academy mode (Teacher only)
  // If selectedAcademy has an ID, it means the teacher is in "Academy Dashboard" mode
  // OR if we are still loading (isLoading is true), we default to "Restricted" mode to prevent flicker
  
  if (role === 'teacher') {
    const isIndependent = selectedAcademy?.id === 'independent' || (!selectedAcademy?.id && !isLoading);

    if (isIndependent) {
      // Independent Teacher Mode
      // Remove Attendance (not needed for independent)
      items = items.filter(item => item.id !== 'attendance');
    } else {
      // Academy Teacher Mode (or loading)
      // They should NOT see: Secretary, Grades (Classes), Reports, Subscription
      // They SHOULD see: Attendance, Videos (now always visible)
      items = items
        .filter(item =>
          item.id !== 'reports' &&
          item.id !== 'subscription' // Hide subscription for non-independent teachers
        )
        .map(item => {
          if (item.id === 'gamification') {
            return { ...item, href: '/academy/gamification' };
          }
          if (item.id === 'videos') {
            return { ...item, href: '/academy/videos' };
          }
          if (item.id === 'attendance') {
            return { ...item, href: '/academy/attendance' };
          }
          if (item.id === 'exams') {
            return { ...item, href: '/academy/exams' };
          }
          if (item.id === 'question_bank') {
            return { ...item, href: '/academy/questions' };
          }
          if (item.id === 'lectures') {
            return { ...item, href: '/academy/lectures' };
          }
          if (item.id === 'notifications') {
            return { ...item, href: '/academy/notifications' };
          }
          if (item.children) {
            return {
              ...item,
              children: item.children
                .filter(child =>
                  child.id !== 'secretaries' && // Remove Secretary
                  child.id !== 'grades'         // Remove Grades (Classes)
                )
                .map(child => {
                  if (child.id === 'students') {
                    return { ...child, href: '/academy/students' };
                  }
                  if (child.id === 'groups') {
                    return { ...child, href: '/academy/groups' };
                  }
                  return child;
                })
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
              <Icon name="graduation-cap" />
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
                      <Icon name="chevron-down" className={`ms-auto sidebar-chevron ${expandedItems.includes(item.id) ? 'rotate-180' : ''}`} />
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
