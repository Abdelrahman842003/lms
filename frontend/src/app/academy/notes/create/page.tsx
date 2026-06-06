'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button, Icon, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  getGrades as getAcademyGrades,
  getGroups as getAcademyGroups,
  getLectureTeachers,
} from '@/services/academyService';
import { NoteUploadForm } from '@/components/notes/NoteUploadForm';

interface OptionItem {
  id: string;
  name: string;
  grade_id?: string;
}

export default function AcademyCreateNotePage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  
  const [grades, setGrades] = useState<OptionItem[]>([]);
  const [groups, setGroups] = useState<OptionItem[]>([]);
  const [teachers, setTeachers] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [gradesResponse, groupsResponse, teachersResponse] = await Promise.all([
          getAcademyGrades(1, 100),
          getAcademyGroups(1, 100),
          getLectureTeachers(),
        ]);

        let gradesList = [];
        if (gradesResponse?.data?.data && Array.isArray(gradesResponse.data.data)) {
          gradesList = gradesResponse.data.data;
        } else if (gradesResponse?.data && Array.isArray(gradesResponse.data)) {
          gradesList = gradesResponse.data;
        } else if (Array.isArray(gradesResponse)) {
          gradesList = gradesResponse;
        }

        let groupsList = [];
        if (groupsResponse?.data?.data && Array.isArray(groupsResponse.data.data)) {
          groupsList = groupsResponse.data.data;
        } else if (groupsResponse?.data && Array.isArray(groupsResponse.data)) {
          groupsList = groupsResponse.data;
        } else if (Array.isArray(groupsResponse)) {
          groupsList = groupsResponse;
        }

        const teachersList = teachersResponse?.data?.teachers || [];

        setGrades(gradesList.map((item: any) => ({ id: String(item.id), name: item.name })));
        setGroups(
          groupsList.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            grade_id: item.grade_id ? String(item.grade_id) : undefined,
          }))
        );
        setTeachers(teachersList.map((item: any) => ({ id: String(item.id), name: item.name })));
      } catch (error) {
        console.error('Failed to load options:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadOptions();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c1b]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-light/60 mt-4 animate-pulse">جاري تجهيز استوديو الرفع...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0">
        {/* Header Section */}
        <div className="relative mb-8 md:mb-12 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="hidden md:block absolute top-8 left-8 z-20">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white transition-all p-0"
            >
              <Icon name="arrow-right" />
            </Button>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-right">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-3xl md:text-4xl shadow-2xl">
              <Icon name="file-pdf" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">إضافة مذكرة للأكاديمية</h1>
              <p className="text-gray-light/60 text-sm md:text-lg font-medium mt-2">قم برفع مذكرات تعليمية وربطها بمدرس معين لطلاب الأكاديمية</p>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex md:hidden items-center gap-2 text-primary bg-primary/10 px-6 py-3 rounded-2xl text-sm font-bold mt-4 border border-primary/20"
            >
              <Icon name="arrow-right" size="sm" />
              <span>رجوع للقائمة</span>
            </Button>
          </div>
        </div>

        <NoteUploadForm
          mode="academy"
          grades={grades}
          groups={groups}
          teachers={teachers}
          onCreated={() => router.push('/academy/notes')}
        />
      </div>
    </DashboardLayout>
  );
}
