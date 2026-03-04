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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content manual-attendance-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>تسجيل حضور يدوي</h3>
          <button onClick={onClose} className="modal-close" type="button" aria-label="إغلاق">
            <Icon name="times" size="xl" />
          </button>
        </div>

        <div className="modal-body">
          <p className="manual-attendance-lecture">
            محاضرة: <span className="manual-attendance-lecture-name">{lectureTitle}</span>
          </p>

          <div className="ui-input-container ux-mb-6">
            <input
              ref={inputRef}
              type="text"
              className="form-input manual-attendance-input"
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
            <Icon name="search" className="manual-attendance-search-icon" />
          </div>

          {isLoading ? (
            <div className="manual-attendance-state">
              <LoadingSpinner size="md" color="primary" />
              <p className="manual-attendance-muted">جاري البحث...</p>
            </div>
          ) : student ? (
            <div className="manual-attendance-student-card">
              <div className="manual-attendance-student-head">
                <div className={`manual-attendance-avatar ${student.gender === 'female' ? 'female' : 'male'}`}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h4 className="manual-attendance-student-name">{student.name}</h4>
                  <p className="manual-attendance-muted">{student.phone}</p>
                </div>
              </div>

              <Button
                onClick={handleMarkAttendance}
                disabled={isMarking || alreadyAttended}
                className={`manual-attendance-action ${
                  alreadyAttended
                    ? 'manual-attendance-action-done'
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
            <div className="manual-attendance-state">
              {/^01[0125][0-9]{8}$/.test(searchQuery) ? (
                <>
                  <Icon name="user-slash" size="3x" className="manual-attendance-state-icon" />
                  <p>لم يتم العثور على طالب بهذا الرقم</p>
                </>
              ) : (
                <>
                  <Icon name="exclamation-circle" size="3x" className="manual-attendance-state-icon warning" />
                  <p>الرجاء إدخال رقم هاتف مصري صحيح (11 رقم)</p>
                </>
              )}
            </div>
          ) : (
            <div className="manual-attendance-state">
              <Icon name="keyboard" size="3x" className="manual-attendance-state-icon" />
              <p>ابدأ الكتابة للبحث...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
