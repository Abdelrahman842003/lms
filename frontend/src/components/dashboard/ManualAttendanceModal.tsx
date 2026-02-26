import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/services/authService';
import toast from 'react-hot-toast';
import { LoadingSpinner, Button, Icon, Input } from '@/components/ui';

interface Student {
  id: string;
  name: string;
  phone: string;
  parent_phone: string;
  gender: 'male' | 'female';
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lectureId: string;
  lectureTitle: string;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  lectureId,
  lectureTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [alreadyAttended, setAlreadyAttended] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery('');
      setStudent(null);
      setAlreadyAttended(false);
    }
  }, [isOpen]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Egyptian phone validation: 11 digits, starts with 010, 011, 012, or 015
      const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
      
      if (egyptianPhoneRegex.test(searchQuery)) {
        handleSearch();
      } else {
        setStudent(null);
        setAlreadyAttended(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Use the search-phone endpoint
      const response = await fetchApi(`/teacher/students/search-phone?phone=${searchQuery}`);
      
      if (response.found && response.student) {
        setStudent(response.student);
        
        // Check if already attended this specific lecture
        // We can't know from search-phone if they attended THIS lecture, 
        // so we'll rely on the recordAttendance call or we could check attendees list if we had it.
        // For now, we'll just show the student and let the teacher try to mark attendance.
        // The backend recordAttendance will return 'already_attended' status if so.
      } else {
        setStudent(null);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!student) return;

    setIsMarking(true);
    try {
      const response = await fetchApi(`/teacher/lectures/${lectureId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ student_id: student.id }),
      });

      if (response.status === 'already_attended') {
        toast.error('الطالب مسجل حضور بالفعل');
        setAlreadyAttended(true);
      } else {
        toast.success('تم تسجيل الحضور بنجاح');
        setAlreadyAttended(true);
        // Clear search to allow next student
        setSearchQuery('');
        setStudent(null);
        setAlreadyAttended(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الحضور');
    } finally {
      setIsMarking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#1a1f37] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">تسجيل حضور يدوي</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="times" size="xl" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-light mb-4 text-sm">
            محاضرة: <span className="text-primary font-semibold">{lectureTitle}</span>
          </p>

          <div className="relative mb-6">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-[#101426] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors pl-10"
              placeholder="اكتب رقم هاتف الطالب..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 11) {
                  setSearchQuery(value);
                }
              }}
              maxLength={11}
            />
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="md" color="primary" className="mx-auto mb-2" />
              <p className="text-gray-500 text-sm">جاري البحث...</p>
            </div>
          ) : student ? (
            <div className="bg-[#101426] rounded-xl p-4 border border-white/10 animate-fade-in">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  student.gender === 'female' ? 'bg-pink-500/20 text-pink-500' : 'bg-blue-500/20 text-blue-500'
                }`}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-bold">{student.name}</h4>
                  <p className="text-gray-500 text-sm">{student.phone}</p>
                </div>
              </div>

              <Button
                onClick={handleMarkAttendance}
                disabled={isMarking || alreadyAttended}
                className={`w-full ${
                  alreadyAttended
                    ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                    : ''
                }`}
              >
                {isMarking ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : alreadyAttended ? (
                  <>
                    <Icon name="check" />
                    <span>تم التحضير</span>
                  </>
                ) : (
                  <>
                    <Icon name="user-check" />
                    <span>تسجيل حضور</span>
                  </>
                )}
              </Button>
            </div>
          ) : searchQuery.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              {/^01[0125][0-9]{8}$/.test(searchQuery) ? (
                <>
                  <Icon name="user-slash" size="3x" className="mb-2 opacity-50" />
                  <p>لم يتم العثور على طالب بهذا الرقم</p>
                </>
              ) : (
                <>
                  <Icon name="exclamation-circle" size="3x" className="mb-2 opacity-50 text-warning" />
                  <p>الرجاء إدخال رقم هاتف مصري صحيح (11 رقم)</p>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon name="keyboard" size="3x" className="mb-2 opacity-50" />
              <p>ابدأ الكتابة للبحث...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
