'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAuthToken } from '@/services/authService';
import { Button, LoadingSpinner, Icon } from '@/components/ui/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'queued' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري تسجيل الحضور...');
  const [lectureTitle, setLectureTitle] = useState('');
  const [queuePosition, setQueuePosition] = useState(0);

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

  // WebSocket listener for queue
  useEffect(() => {
    if (status !== 'queued' || !user?.id) return;

    let channel: any = null;

    const setupEcho = async () => {
      try {
        const { initializeEcho } = await import('@/lib/echo');
        const authToken = getAuthToken();
        if (!authToken) return;

        const echo = initializeEcho(authToken);
        channel = echo.private(`notifications.student.${user.id}`)
          .listen('.AttendanceProcessed', (data: any) => {
            const result = data.result;
            if (result.status === 'success') {
              setStatus('success');
              setMessage(result.was_recently_created ? 'تم تسجيل الحضور بنجاح!' : 'تم تحديث الحضور بنجاح!');
              setLectureTitle(result.lecture?.title || '');
            } else {
              setStatus('error');
              setMessage(result.message || 'فشل تسجيل الحضور.');
            }
          });
      } catch (error) {
        console.error('Echo setup failed:', error);
      }
    };

    setupEcho();

    return () => {
      if (channel) {
        channel.stopListening('.AttendanceProcessed');
      }
    };
  }, [status, user?.id]);

  const markAttendance = async () => {
    try {
      const authToken = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/student/attend`, {
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
        if (data.status === 'queued') {
          setStatus('queued');
          setMessage(data.message);
          setQueuePosition(data.position);
          setLectureTitle(data.lecture_title || '');
          return;
        }
        
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
          <LoadingSpinner size="lg" className="mx-auto mb-4 w-12 h-12" />
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
              <LoadingSpinner size="lg" className="mx-auto mb-6 w-16 h-16" />
              <h2 className="text-2xl font-bold text-white mb-2">جاري تسجيل الحضور</h2>
              <p className="text-gray-light">{message}</p>
            </>
          )}

          {status === 'queued' && (
            <>
              <div className="w-20 h-20 mb-8 relative mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xl">
                  {queuePosition}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">في قائمة الانتظار</h2>
              <p className="text-gray-light mb-4">{message}</p>
              {lectureTitle && (
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-light mb-1">المحاضرة</p>
                  <p className="text-lg font-semibold text-white">{lectureTitle}</p>
                </div>
              )}
              <p className="text-xs text-gray-light italic">سيتم التحويل تلقائياً، لا تغلق الصفحة...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="check" size="2x" className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تم بنجاح!</h2>
              <p className="text-gray-light mb-4">{message}</p>
              {lectureTitle && (
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-light mb-1">المحاضرة</p>
                  <p className="text-lg font-semibold text-white">{lectureTitle}</p>
                </div>
              )}
              <Button
                onClick={() => router.push('/student/dashboard')}
                variant="primary"
                className="w-full"
              >
                الذهاب للوحة التحكم
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="times" size="2x" className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">فشل</h2>
              <p className="text-red-400 mb-6">{message}</p>
              <Button
                onClick={() => router.push('/student/dashboard')}
                variant="outline"
                className="w-full"
              >
                الذهاب للوحة التحكم
              </Button>
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
