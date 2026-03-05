'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import * as academyService from '@/services/academyService';
import toast from 'react-hot-toast';

import { Button, Icon, Input, Badge, LoadingSpinner } from '@/components/ui';
interface Student {
  id: string;
  name: string;
  phone: string;
  status?: 'present' | 'absent';
}

interface AttendeeApiRow {
  student_id?: string;
  student_name?: string;
  student_phone?: string;
  status?: 'present' | 'absent';
  student?: {
    id?: string;
    name?: string;
    phone?: string;
  };
}

export default function ManualAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lectureId = params.id as string;

  const [lecture, setLecture] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLectureAndStudents();
  }, [lectureId]);

  const fetchLectureAndStudents = async () => {
    try {
      setIsLoading(true);
      const [lectureResponse, attendeesResponse] = await Promise.all([
        academyService.getLecture(lectureId),
        academyService.getLectureAttendees(lectureId),
      ]);

      const lectureData = lectureResponse?.data?.lecture ?? lectureResponse?.data ?? null;
      setLecture(lectureData);
      
      // Get all students with their current attendance status
      const attendeesData: AttendeeApiRow[] = attendeesResponse?.data?.attendees || [];
      const studentsWithStatus = attendeesData
        .map((a) => {
          const id = a.student_id ?? a.student?.id;
          if (!id) return null;

          return {
            id,
            name: a.student_name ?? a.student?.name ?? 'طالب',
            phone: a.student_phone ?? a.student?.phone ?? '-',
            status: a.status ?? 'absent',
          } as Student;
        })
        .filter((s): s is Student => Boolean(s));
      
      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttendance = async (studentId: string, currentStatus: 'present' | 'absent' | undefined) => {
    try {
      if (currentStatus === 'present') {
        toast.error('الطالب مسجل حضوره بالفعل');
        return;
      }

      await academyService.recordManualAttendance(lectureId, studentId);
      
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, status: 'present' as const } : s
        )
      );
      
      toast.success('تم تسجيل الحضور');
    } catch (error: any) {
      console.error('Failed to record attendance:', error);
      toast.error(error.response?.data?.message || 'فشل تسجيل الحضور');
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery)
  );

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          <Icon name="arrow-right" />
          <span>رجوع</span>
        </Button>
        <h1 className="text-2xl font-bold text-white mb-2">
          تسجيل الحضور اليدوي
        </h1>
        <p className="text-gray-400">
          {lecture?.title} - {lecture?.date}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="بحث عن طالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Students List */}
      <div className="bg-[#1e1e2d] rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">الطلاب</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="lg" color="primary" />
            <p className="text-gray-400 mt-4">جاري التحميل...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="users" className="text-5xl text-gray-500 mb-4" />
            <p className="text-gray-400">لا يوجد طلاب</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 hover:bg-white/5 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-white font-medium">{student.name}</h3>
                  <p className="text-gray-400 text-sm">{student.phone}</p>
                </div>
                <Button
                  variant={student.status === 'present' ? 'ghost' : 'primary'}
                  onClick={() => toggleAttendance(student.id, student.status)}
                  disabled={student.status === 'present'}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    student.status === 'present'
                      ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {student.status === 'present' ? (
                    <>
                      <Icon name="check" className="mr-2" />
                      حاضر
                    </>
                  ) : (
                    <>
                      <Icon name="user-check" className="mr-2" />
                      تسجيل حضور
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
