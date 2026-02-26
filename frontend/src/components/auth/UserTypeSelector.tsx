import React from 'react';
import { Button } from '@/components/ui';
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
    <div className="mb-[30px]">
      {/* Mobile: 2 rows with 3 items first row, 2 items second row */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {userTypes.map((item) => (
          <Button
            key={item.type}
            type="button"
            variant={isSelected(item.type) ? 'primary' : 'outline'}
            size="md"
            onClick={() => onChange(item.type)}
            className={`
              flex flex-col items-center gap-2 p-3 
              border-2 border-[#0D1120] rounded-[14px] 
              text-[#E9ECEF] cursor-pointer 
              transition-all duration-300 
              text-[0.85rem] font-semibold 
              hover:border-primary/40 hover:-translate-y-0.5
              active:scale-95
              ${isSelected(item.type) ? 'bg-primary text-white -translate-y-0.5 shadow-lg shadow-primary/30' : ''}
            `}
          >
            <Icon name={item.icon.replace('fa-', '')} size="lg" className="mb-[3px]" />
            <span className="text-[0.75rem] md:text-[0.85rem]">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
