import React from 'react';

interface UserTypeSelectorProps {
  userType: 'student' | 'teacher' | 'secretary';
  onChange: (type: 'student' | 'teacher' | 'secretary') => void;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ userType, onChange }) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-[30px]">
      <button
        type="button"
        className={`flex flex-col items-center gap-2 p-4 border-2 border-[#0D1120] rounded-[14px] text-[#E9ECEF] cursor-pointer transition-all duration-300 text-[0.95rem] font-semibold hover:border-primary/40 hover:-translate-y-0.5 ${userType === 'student' ? 'bg-primary text-white -translate-y-0.5' : ''}`}
        onClick={() => onChange('student')}
      >
        <i className="fas fa-user-graduate text-[1.8rem] mb-[3px]"></i>
        <span>طالب</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center gap-2 p-4 border-2 border-[#0D1120] rounded-[14px] text-[#E9ECEF] cursor-pointer transition-all duration-300 text-[0.95rem] font-semibold hover:border-primary/40 hover:-translate-y-0.5 ${userType === 'teacher' ? 'bg-primary text-white -translate-y-0.5' : ''}`}
        onClick={() => onChange('teacher')}
      >
        <i className="fas fa-chalkboard-teacher text-[1.8rem] mb-[3px]"></i>
        <span>مدرس</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center gap-2 p-4 border-2 border-[#0D1120] rounded-[14px] text-[#E9ECEF] cursor-pointer transition-all duration-300 text-[0.95rem] font-semibold hover:border-primary/40 hover:-translate-y-0.5 ${userType === 'secretary' ? 'bg-primary text-white -translate-y-0.5' : ''}`}
        onClick={() => onChange('secretary')}
      >
        <i className="fas fa-user-tie text-[1.8rem] mb-[3px]"></i>
        <span>سكرتير</span>
      </button>
    </div>
  );
};
