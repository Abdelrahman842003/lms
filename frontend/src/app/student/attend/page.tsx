'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري تسجيل الحضور...');
  const [lectureTitle, setLectureTitle] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login if not authenticated, preserving the return URL
      const returnUrl = encodeURIComponent(`/student/attend?token=${token}`);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('رابط الحضور غير صالح. الرمز مفقود.');
      return;
    }

    markAttendance();
  }, [user, authLoading, token, router]);

  const markAttendance = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/student/attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'تم تسجيل الحضور بنجاح!');
        setLectureTitle(data.lecture || '');
      } else {
        setStatus('error');
        setMessage(data.message || 'فشل تسجيل الحضور.');
      }
    } catch (error) {
      console.error('Attendance error:', error);
      setStatus('error');
      setMessage('حدث خطأ أثناء تسجيل الحضور.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-[#1e1e2d] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">جاري تسجيل الحضور</h2>
              <p className="text-gray-light">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-check text-3xl text-green-500"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تم بنجاح!</h2>
              <p className="text-gray-light mb-4">{message}</p>
              {lectureTitle && (
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-light mb-1">المحاضرة</p>
                  <p className="text-lg font-semibold text-white">{lectureTitle}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/student/dashboard')}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                الذهاب للوحة التحكم
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-times text-3xl text-red-500"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">فشل</h2>
              <p className="text-red-400 mb-6">{message}</p>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                الذهاب للوحة التحكم
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentAttendancePage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
