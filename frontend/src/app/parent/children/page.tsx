'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageTransition } from '@/components/shared/PageTransition';

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user, children, selectedChild, selectChild } = useAuth();

  const handleSelectChild = (child: typeof children[0]) => {
    selectChild(child);
    router.push(`/parent/${child.id}/summary`);
  };

  return (
    <PageTransition>
      <DashboardLayout
        role="parent"
        user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
        title="أبنائي"
      >
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              مرحباً ولي الأمر
            </h1>
            <p className="text-gray-400">
              اختر ابنك لعرض تقاريره ومتابعة أدائه
            </p>
          </div>

          {/* Children Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child)}
                className={`bg-[#1A1F2E] rounded-xl p-5 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-right ${
                  selectedChild?.id === child.id
                    ? 'border-primary shadow-primary/20'
                    : 'border-transparent hover:border-primary/30'
                }`}
              >
                {/* Child Avatar & Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-2xl font-bold">
                    {child.avatar ? (
                      <img
                        src={child.avatar}
                        alt={child.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      child.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{child.name}</h3>
                    {child.phone && (
                      <p className="text-gray-400 text-sm">{child.phone}</p>
                    )}
                  </div>
                </div>

                {/* Teachers List */}
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">المدرسين:</p>
                  {child.teachers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {child.teachers.slice(0, 3).map((teacher) => (
                        <span
                          key={teacher.id}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {teacher.name}
                        </span>
                      ))}
                      {child.teachers.length > 3 && (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                          +{child.teachers.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">لا يوجد مدرسين مسجلين</p>
                  )}
                </div>

                {/* View Button */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-primary text-sm font-medium flex items-center gap-2">
                    عرض التقارير
                    <i className="fas fa-arrow-left"></i>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Empty State */}
          {children.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-users text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                لا يوجد أبناء مسجلين
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                لم يتم ربط أي طالب برقم هاتفك. تواصل مع المدرس لتسجيل رقمك كولي أمر.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
