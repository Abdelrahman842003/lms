'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { ConfirmationModal, Icon } from '@/components/ui';
import { NavbarOverlayDropdown } from './NavbarOverlayDropdown';
import { normalizeStudentTeachers } from '@/utils/studentTeacherAccess';

export const TeacherSelectionDropdown: React.FC = () => {
  const CLOSE_ANIMATION_MS = 220;
  const { user, selectedTeacher, selectTeacher } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    confirmText: 'موافق',
    variant: 'danger' as 'danger' | 'success' | 'warning',
    onConfirm: () => {},
    showCancel: true,
  });

  const teachers = useMemo(() => normalizeStudentTeachers(user?.teachers), [user?.teachers]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const closeDropdown = () => {
    if (!isOpen || isClosing) return;

    setIsClosing(true);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  };

  const openDropdown = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsClosing(false);
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = dropdownRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);

      if (!clickedTrigger && !clickedPanel) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  const handleTeacherSelect = (teacher: any) => {
    // Check Status
    if (teacher.is_suspended) {
      setModalConfig({
        title: 'حساب معلق',
        message: 'عذراً، هذا المدرس معلق حالياً ولا يمكن الوصول لبياناته. يرجى التواصل مع الإدارة.',
        confirmText: 'حسناً',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    if (teacher.status === 'expired') {
      setModalConfig({
        title: 'اشتراك منتهي',
        message: 'عذراً، لقد انتهى اشتراكك مع هذا المدرس. يرجى تجديد الاشتراك للمتابعة.',
        confirmText: 'حسناً',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    if (teacher.status === 'grace_period') {
      setModalConfig({
        title: 'تنبيه انتهاء الاشتراك',
        message: `اشتراكك في فترة السماح وسينتهي خلال ${teacher.days_left} أيام. يرجى تجديد الاشتراك لتجنب توقف الخدمة.`,
        confirmText: 'متابعة',
        variant: 'warning',
        showCancel: true,
        onConfirm: () => {
          selectTeacher(teacher);
          closeDropdown();
          setModalOpen(false);
        },
      });
      setModalOpen(true);
      return;
    }

    if (teacher.status === 'inactive') {
      setModalConfig({
        title: 'حساب غير مفعل',
        message: 'حسابك مع هذا المدرس غير مفعل حالياً. يرجى التواصل مع المدرس للتفعيل.',
        confirmText: 'حسناً',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    selectTeacher(teacher);
    closeDropdown();
  };

  return (
    <div className="navbar-user" ref={dropdownRef}>
      <button
        type="button"
        className="navbar-user-clickable teacher-selector-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        title="تغيير المدرس"
      >
        <div className="teacher-selector-avatar">
          {selectedTeacher?.teacher_avatar ? (
            <img src={selectedTeacher.teacher_avatar} alt="" className="teacher-selector-avatar-img" />
          ) : (
            <span className="teacher-selector-avatar-placeholder"><Icon name="chalkboard-teacher" /></span>
          )}
        </div>
        <span className="teacher-selector-name">
          {selectedTeacher?.teacher_name || 'اختر مدرس'}
        </span>
        <span className={`teacher-selector-chevron ${isOpen ? 'open' : ''}`}>
          <Icon name="chevron-down" />
        </span>
      </button>

      <NavbarOverlayDropdown
        isOpen={isOpen}
        isClosing={isClosing}
        panelRef={panelRef}
        className="teacher-selection-dropdown"
        backdropClassName="teacher-selection-dropdown-backdrop"
        ariaLabel="اختيار المدرس"
        onBackdropClick={closeDropdown}
      >
        <div className="notification-dropdown-header teacher-selection-dropdown-header">
          <h3 className="notification-dropdown-title">اختر المدرس</h3>
        </div>
        
        <div className="notification-dropdown-list teacher-dropdown-list">
          {teachers.length === 0 ? (
            <div className="notification-dropdown-empty teacher-dropdown-empty">
              <span className="notification-dropdown-empty-icon"><Icon name="chalkboard-teacher" /></span>
              لا يوجد مدرسين مشترك معهم حالياً
            </div>
          ) : (
            <TeacherList
              teachers={teachers}
              selectedTeacher={selectedTeacher}
              onSelect={handleTeacherSelect}
            />
          )}
        </div>
      </NavbarOverlayDropdown>

      <ConfirmationModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
        showCancel={modalConfig.showCancel}
      />
    </div>
  );
};

const TeacherList = ({ teachers, selectedTeacher, onSelect }: { teachers: any[], selectedTeacher: any, onSelect: (t: any) => void }) => {
  const [expandedAcademy, setExpandedAcademy] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const academies: Record<string, { id: string, name: string, teachers: any[] }> = {};
    const independent: any[] = [];

    teachers.forEach(teacher => {
      if (teacher.academy_id) {
        if (!academies[teacher.academy_id]) {
          academies[teacher.academy_id] = {
            id: teacher.academy_id,
            name: teacher.academy_name || 'أكاديمية غير معروفة',
            teachers: []
          };
        }
        academies[teacher.academy_id].teachers.push(teacher);
      } else {
        independent.push(teacher);
      }
    });

    return { academies: Object.values(academies), independent };
  }, [teachers]);

  const toggleAcademy = (id: string) => {
    setExpandedAcademy(expandedAcademy === id ? null : id);
  };

  return (
    <>
      {/* Academies */}
      {grouped.academies.map(academy => (
        <div key={academy.id} className="teacher-dropdown-academy">
          <div 
            onClick={() => toggleAcademy(academy.id)}
            className={`teacher-dropdown-academy-header ${expandedAcademy === academy.id ? 'expanded' : ''}`}
          >
            <div className="teacher-dropdown-academy-info">
              <div className="teacher-dropdown-academy-icon">
                <Icon name="university" />
              </div>
              <span className="teacher-dropdown-academy-name">{academy.name}</span>
            </div>
            <span className={`teacher-dropdown-academy-chevron ${expandedAcademy === academy.id ? 'open' : ''}`}>
              <Icon name="chevron-down" className={expandedAcademy === academy.id ? 'fa-rotate-180' : ''} />
            </span>
          </div>

          {expandedAcademy === academy.id && (
            <div className="teacher-dropdown-nested-wrap">
              {academy.teachers.map(teacher => (
                <TeacherItem 
                  key={teacher.teacher_id} 
                  teacher={teacher} 
                  selectedTeacher={selectedTeacher} 
                  onSelect={onSelect} 
                  isNested={true}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Independent Teachers */}
      {grouped.independent.map(teacher => (
        <TeacherItem 
          key={teacher.teacher_id} 
          teacher={teacher} 
          selectedTeacher={selectedTeacher} 
          onSelect={onSelect} 
        />
      ))}
    </>
  );
};

const TeacherItem = ({ teacher, selectedTeacher, onSelect, isNested = false }: { teacher: any, selectedTeacher: any, onSelect: (t: any) => void, isNested?: boolean }) => (
  <div 
    className={`teacher-dropdown-item ${selectedTeacher?.teacher_id === teacher.teacher_id ? 'teacher-dropdown-item-selected' : ''} ${isNested ? 'teacher-dropdown-item-nested' : ''} ${(teacher.status === 'expired' || teacher.status === 'inactive') ? 'teacher-dropdown-item-disabled' : ''}`}
    onClick={() => onSelect(teacher)}
  >
    <div className="teacher-item-avatar">
      {teacher.teacher_avatar ? (
        <img src={teacher.teacher_avatar} alt="" className="teacher-item-avatar-img" />
      ) : (
        <span className="teacher-item-avatar-placeholder"><Icon name="chalkboard-teacher" /></span>
      )}
    </div>
    <div className="teacher-item-main">
      <div className="teacher-item-header">
        <h4 className="teacher-item-name">
          {teacher.teacher_name}
          {!isNested && teacher.academy_name && (
            <span className="text-xs opacity-75 mr-2">
              ({teacher.academy_name})
            </span>
          )}
        </h4>
        {teacher.status === 'grace_period' && (
          <span className="teacher-item-state warning">فترة سماح</span>
        )}
        {teacher.status === 'expired' && (
          <span className="teacher-item-state danger">منتهي</span>
        )}
      </div>
      <p className="teacher-item-meta">
        {teacher.grade_name} - {teacher.group_name}
        {teacher.subject && ` • ${teacher.subject}`}
      </p>
    </div>
    {selectedTeacher?.teacher_id === teacher.teacher_id && (
      <span className="teacher-item-check"><Icon name="check-circle" /></span>
    )}
  </div>
);
