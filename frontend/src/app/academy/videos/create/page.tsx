'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  getGrades as getAcademyGrades,
  getGroups as getAcademyGroups,
  getLectureTeachers,
} from '@/services/academyService';
import { VideoUploadForm } from '@/components/video/VideoUploadForm';

interface OptionItem {
  id: string;
  name: string;
  grade_id?: string;
}

export default function AcademyCreateVideoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [grades, setGrades] = useState<OptionItem[]>([]);
  const [groups, setGroups] = useState<OptionItem[]>([]);
  const [teachers, setTeachers] = useState<OptionItem[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [gradesResponse, groupsResponse, teachersResponse] = await Promise.all([
        getAcademyGrades(1, 100),
        getAcademyGroups(1, 100),
        getLectureTeachers(),
      ]);

      const gradesList = gradesResponse?.data?.data || [];
      const groupsList = groupsResponse?.data?.data || [];
      const teachersList = teachersResponse?.data?.teachers || [];

      setGrades(gradesList.map((item: any) => ({ id: item.id, name: item.name })));
      setGroups(groupsList.map((item: any) => ({ id: item.id, name: item.name, grade_id: item.grade_id })));
      setTeachers(teachersList.map((item: any) => ({ id: item.id, name: item.name })));
    };

    void loadOptions();
  }, []);

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <Icon name="arrow-right" />
            <span>رجوع</span>
          </Button>
          <h1 className="text-3xl font-bold text-white">فيديو تعليمي جديد</h1>
          <p className="text-gray-400 mt-2">أضف فيديو جديد للأكاديمية واربطه بالمدرس والصف والمجموعات.</p>
        </div>

        <VideoUploadForm
          mode="academy"
          grades={grades}
          groups={groups}
          teachers={teachers}
          onCreated={() => router.push('/academy/videos')}
        />
      </div>
    </DashboardLayout>
  );
}
