'use client';
import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/services/authService';
import toast from 'react-hot-toast';
import { LoadingSpinner, Icon } from '@/components/ui';

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
    if (isOpen && inputRef.current) inputRef.current.focus();
    if (!isOpen) {
      setSearchQuery('');
      setStudent(null);
      setAlreadyAttended(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
      if (egyptianPhoneRegex.test(searchQuery)) handleSearch();
      else {
        setStudent(null);
        setAlreadyAttended(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi(`/teacher/students/search-phone?phone=${searchQuery}`);
      if (response.found && response.student) setStudent(response.student);
      else setStudent(null);
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
        setSearchQuery('');
        setStudent(null);
        setAlreadyAttended(false);
        if (inputRef.current) inputRef.current.focus();
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الحضور');
    } finally {
      setIsMarking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Immersive Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />

      {/* Premium Modal Card */}
      <div className="relative w-full max-w-md bg-slate-950/90 border border-white/10 rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">تسجيل يدوي</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{lectureTitle}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <Icon name="times" className="text-sm" />
          </button>
        </div>

        <div className="px-8 pb-8 flex flex-col items-center">
          
          {/* Enhanced Search Area */}
          <div className="w-full relative group mb-8">
            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
              <Icon name="search" className={`text-lg transition-colors ${searchQuery ? 'text-primary' : 'text-gray-light/20'}`} />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="اكتب رقم هاتف الطالب..."
              className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pr-14 pl-6 text-white font-bold text-lg placeholder:text-gray-light/20 focus:bg-white/[0.08] focus:border-primary/50 focus:ring-0 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                setSearchQuery(val);
              }}
            />
            {isLoading && (
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                <LoadingSpinner size="sm" color="primary" />
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="w-full min-h-[160px] flex flex-col items-center justify-center">
            {student ? (
              <div className="w-full p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${
                    student.gender === 'female' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-white truncate">{student.name}</h4>
                    <p className="text-xs font-bold text-gray-light/40 mt-1 uppercase tracking-widest">{student.phone}</p>
                  </div>
                </div>

                <button
                  onClick={handleMarkAttendance}
                  disabled={isMarking || alreadyAttended}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    alreadyAttended 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110'
                  }`}
                >
                  {isMarking ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : alreadyAttended ? (
                    <><Icon name="check" /> تم التحضير</>
                  ) : (
                    <><Icon name="user-check" /> تسجيل الحضور</>
                  )}
                </button>
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="text-center opacity-40 animate-in fade-in duration-500">
                <Icon name={searchQuery.length === 11 ? "user-slash" : "info-circle"} className="text-4xl mb-4" />
                <p className="text-sm font-bold leading-relaxed max-w-[200px]">
                  {searchQuery.length === 11 
                    ? "لم يتم العثور على طالب بهذا الرقم" 
                    : "يرجى إكمال رقم الهاتف (11 رقم)"}
                </p>
              </div>
            ) : (
              <div className="text-center opacity-20 animate-in fade-in duration-500">
                <Icon name="keyboard" className="text-4xl mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">ابدأ البحث بالرقم</p>
              </div>
            )}
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
