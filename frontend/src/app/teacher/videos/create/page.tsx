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
  if (!isIndependentSelected || !isIndependentAccountActive) return;

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isIndependentSelected) {
    return (
      <AppNotFound
        description="هذه الصفحة متاحة فقط عند اختيار وضع المدرس المستقل."
        hint="تلميح: اختر (مدرس مستقل) من مبدّل الأكاديمية في أعلى الصفحة."
        actionHref="/teacher/dashboard"
        actionLabel="الرجوع للوحة التحكم"
      />
    );
  }

  if (!hasIndependentFlag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">جاري التحقق من صلاحية الحساب المستقل...</p>
        </div>
      </div>
    );
  }

  if (!isIndependentAccountActive) {
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
          <p className="text-gray-400 mt-2">أضف فيديو جديد للطلاب بنفس إعدادات المحاضرات.</p>
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
