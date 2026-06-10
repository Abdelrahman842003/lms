'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppNotFound } from '@/components/shared/AppNotFound';
import { Button, Icon, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGrades, getGroups } from '@/services/authService';
import { VideoUploadForm } from '@/components/video/VideoUploadForm';

interface OptionItem {
  id: string;
  name: string;
  grade_id?: string;
}

interface RawOptionItem {
  id: string | number;
  name: string;
  grade_id?: string | number | null;
}

const extractItems = (payload: unknown): RawOptionItem[] => {
  if (Array.isArray(payload)) return payload as RawOptionItem[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) return record.data as RawOptionItem[];
  if (Array.isArray(record.grades)) return record.grades as RawOptionItem[];
  if (Array.isArray(record.groups)) return record.groups as RawOptionItem[];

  const nestedData = record.data;
  if (nestedData && typeof nestedData === 'object') {
    const nestedRecord = nestedData as Record<string, unknown>;
    if (Array.isArray(nestedRecord.data)) return nestedRecord.data as RawOptionItem[];
  }

  return [];
};

export default function TeacherCreateVideoPage() {
  const { user, selectedAcademy, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [grades, setGrades] = useState<OptionItem[]>([]);
  const [groups, setGroups] = useState<OptionItem[]>([]);
  const isIndependentSelected = !selectedAcademy || selectedAcademy?.id === 'independent';
  const hasIndependentFlag = typeof user?.is_independent_active === 'boolean';
  const isIndependentAccountActive = user?.is_independent_active === true;

  useEffect(() => {
    if (isLoading || user?.userType !== 'teacher') return;
    if (!isIndependentSelected) return;
    if (hasIndependentFlag) return;

    void refreshUser();
  }, [hasIndependentFlag, isIndependentSelected, isLoading, refreshUser, user?.userType]);

  useEffect(() => {
    if (isLoading || user?.userType !== 'teacher') return;
    if (isIndependentSelected && !isIndependentAccountActive) return;

    const loadOptions = async () => {
      const [loadedGrades, loadedGroups] = await Promise.all([getGrades(), getGroups()]);
      const gradeItems = extractItems(loadedGrades);
      const groupItems = extractItems(loadedGroups);

      setGrades(gradeItems.map((item) => ({ id: String(item.id), name: item.name })));
      setGroups(
        groupItems.map((item) => ({
          id: String(item.id),
          name: item.name,
          grade_id: item.grade_id !== undefined && item.grade_id !== null ? String(item.grade_id) : undefined,
        })),
      );
    };

    void loadOptions();
  }, [isIndependentAccountActive, isIndependentSelected, isLoading, user?.userType]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c1b]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-light/60 mt-4 animate-pulse">جاري تجهيز استوديو الرفع...</p>
        </div>
      </div>
    );
  }

  if (isIndependentSelected && !hasIndependentFlag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c1b]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-light/60 mt-4 animate-pulse">جاري التحقق من صلاحية الحساب المستقل...</p>
        </div>
      </div>
    );
  }

  if (isIndependentSelected && !isIndependentAccountActive) {
    return (
      <AppNotFound
        description="الحساب المستقل غير مفعّل حاليًا، لذلك لا يمكنك رفع فيديوهات مستقلة."
        hint="يمكنك استخدام وضع الأكاديمية إن كان متاحًا، أو التواصل مع الإدارة لتفعيل الحساب المستقل."
        actionHref="/teacher/videos"
        actionLabel="الرجوع إلى الفيديوهات"
      />
    );
  }

  return (
    <DashboardLayout role="teacher" user={user || undefined}>
      <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0">
        {/* Header Section */}
        <div className="relative mb-8 md:mb-12 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          
          {/* Back Button for Desktop Only */}
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
              <Icon name="video" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">فيديو تعليمي جديد</h1>
              <p className="text-gray-light/60 text-sm md:text-lg font-medium mt-2">قم برفع محتوى تعليمي بدقة عالية وبكل سهولة</p>
            </div>
            
            {/* Back Button for Mobile Only */}
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

        <VideoUploadForm
          mode="teacher"
          grades={grades}
          groups={groups}
          onCreated={() => router.push('/teacher/videos')}
        />
      </div>
    </DashboardLayout>
  );
}
