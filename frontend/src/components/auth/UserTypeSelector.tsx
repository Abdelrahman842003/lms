import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface UserTypeSelectorProps {
  userType: 'student' | 'teacher' | 'secretary' | 'parent' | 'academy';
  onChange: (type: 'student' | 'teacher' | 'secretary' | 'parent' | 'academy') => void;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ userType, onChange }) => {
  const userTypes = [
    { type: 'student' as const, icon: 'fa-user-graduate', label: 'طالب' },
    { type: 'teacher' as const, icon: 'fa-chalkboard-teacher', label: 'مدرس' },
    { type: 'academy' as const, icon: 'fa-building', label: 'أكاديمية' },
    { type: 'secretary' as const, icon: 'fa-user-tie', label: 'سكرتير' },
    { type: 'parent' as const, icon: 'fa-user-friends', label: 'ولي أمر' },
  ];

  const isSelected = (type: string) => userType === type;

  return (
    <div>
      <div className="user-type-selector">
        {userTypes.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onChange(item.type)}
            className={`user-type-btn ${isSelected(item.type) ? 'active' : ''}`}
          >
            <Icon name={item.icon.replace('fa-', '')} size="lg" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
