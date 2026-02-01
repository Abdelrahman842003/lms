'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';

import { ConfirmationModal } from '@/components/ui';

export const TeacherSelectionDropdown: React.FC = () => {
  const { user, selectedTeacher, selectTeacher } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
          setIsOpen(false);
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
    setIsOpen(false);
  };

  return (
    <div className="navbar-user" ref={dropdownRef}>
      <div 
        className="navbar-user-clickable teacher-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        title="تغيير المدرس"
      >
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedTeacher?.teacher_avatar ? (
            <img src={selectedTeacher.teacher_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
            <i className="fas fa-chalkboard-teacher" style={{ fontSize: '16px', color: '#aaa' }}></i>
            )}
        </div>
        <span className="hidden md:block" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'white', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedTeacher?.teacher_name || 'اختر مدرس'}
        </span>
        <i className="fas fa-chevron-down hidden md:block" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}></i>
      </div>

      {isOpen && (
        <>
          {/* Full screen blur overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.72)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 998,
              cursor: 'default'
            }}
            onClick={() => setIsOpen(false)}
          />
          
          <div className="navbar-dropdown teacher-dropdown" style={{ 
            width: '400px',
            maxWidth: '90vw', 
            padding: '0', 
            left: '50%', 
            top: '80px',
            transform: 'translateX(-50%)',
            backgroundColor: '#0D1120',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            position: 'fixed'
          }}>
            <div style={{ 
              padding: '1.25rem', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent)'
            }}>
              <h3 style={{ fontWeight: '700', color: '#ffffff', margin: 0, fontSize: '1.1rem' }}>اختر المدرس</h3>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {(!user?.teachers || user.teachers.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <i className="fas fa-chalkboard-teacher" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                  لا يوجد مدرسين مشترك معهم حالياً
                </div>
              ) : (
                <TeacherList 
                  teachers={user.teachers} 
                  selectedTeacher={selectedTeacher} 
                  onSelect={handleTeacherSelect} 
                />
              )}
            </div>
          </div>
        </>
      )}

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
        <div key={academy.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div 
            onClick={() => toggleAcademy(academy.id)}
            style={{
              padding: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: expandedAcademy === academy.id ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedAcademy === academy.id ? 'rgba(255, 255, 255, 0.03)' : 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(66, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4263eb' }}>
                <i className="fas fa-university"></i>
              </div>
              <span style={{ color: 'white', fontWeight: 500 }}>{academy.name}</span>
            </div>
            <i className={`fas fa-chevron-down ${expandedAcademy === academy.id ? 'fa-rotate-180' : ''}`} style={{ color: '#aaa', transition: 'transform 0.2s' }}></i>
          </div>

          {expandedAcademy === academy.id && (
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
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
    style={{ 
      padding: isNested ? '0.75rem 1rem 0.75rem 3.5rem' : '1rem', 
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
      cursor: 'pointer',
      backgroundColor: selectedTeacher?.teacher_id === teacher.teacher_id ? 'rgba(66, 99, 235, 0.1)' : 'transparent',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: teacher.status === 'expired' || teacher.status === 'inactive' ? 0.7 : 1
    }}
    onClick={() => onSelect(teacher)}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTeacher?.teacher_id === teacher.teacher_id ? 'rgba(66, 99, 235, 0.1)' : 'transparent'}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {teacher.teacher_avatar ? (
            <img src={teacher.teacher_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
            <i className="fas fa-chalkboard-teacher" style={{ fontSize: '18px', color: '#aaa' }}></i>
        )}
    </div>
    <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>{teacher.teacher_name}</h4>
            {teacher.status === 'grace_period' && (
                <span className="text-warning text-xs px-2 py-0.5 bg-warning/10 rounded-full">فترة سماح</span>
            )}
            {teacher.status === 'expired' && (
                <span className="text-danger text-xs px-2 py-0.5 bg-danger/10 rounded-full">منتهي</span>
            )}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa' }}>
            {teacher.grade_name} - {teacher.group_name}
            {teacher.subject && ` • ${teacher.subject}`}
        </p>
    </div>
    {selectedTeacher?.teacher_id === teacher.teacher_id && (
        <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }}></i>
    )}
  </div>
);
