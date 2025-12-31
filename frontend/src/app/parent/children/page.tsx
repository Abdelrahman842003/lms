'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user, children, selectedChild, selectChild } = useAuth();

  const handleSelectChild = (child: typeof children[0]) => {
    selectChild(child);
    router.push(`/parent/${child.id}/summary`);
  };

  return (
    <DashboardLayout
      role="parent"
      user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
    >
      <div className="p-5">
        <div className="text-center mb-10">
          <h1 className="text-[2rem] text-white flex items-center justify-center gap-3 mb-2">
            <i className="fas fa-users text-primary"></i>
            أبنائي
          </h1>
          <p className="text-gray-light text-base">اختر ابنك لعرض تقاريره ومتابعة أدائه</p>
        </div>

        {children.length === 0 ? (
          <div className="text-center p-[60px_20px] bg-white/3 rounded-2xl border border-white/5">
            <i className="fas fa-user-slash text-[4rem] text-gray-light mb-5"></i>
            <h2 className="text-white mb-2.5">لا يوجد أبناء مسجلين</h2>
            <p className="text-gray-light">لم يتم تسجيل أي طالب برقم هاتفك كولي أمر. تواصل مع المدرس لتسجيل رقمك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {children.map((child) => (
              <div
                key={child.id}
                className={`group bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center relative cursor-pointer hover:-translate-y-1 hover:border-primary hover:shadow-[0_10px_40px_rgba(66,99,235,0.2)]
                  ${selectedChild?.id === child.id ? 'border-primary bg-primary/10' : ''}`}
                onClick={() => handleSelectChild(child)}
              >
                {/* Child Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-[3px] border-white/10">
                  {child.avatar ? (
                    <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-[2rem]">
                      {child.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Child Info */}
                <div className="mb-4">
                  <h3 className="text-white text-xl mb-2">{child.name}</h3>
                  {child.phone && (
                    <p className="text-gray-light text-sm flex items-center justify-center gap-1.5 mb-1">
                      <i className="fas fa-phone"></i>
                      {child.phone}
                    </p>
                  )}
                </div>

                {/* Teachers List */}
                <div className="w-full mb-3">
                  <div className="bg-white/5 rounded-xl p-[12px_20px]">
                    <span className="text-xs text-gray-light block mb-2">المدرسين المشتركين</span>
                    {child.teachers && child.teachers.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center">
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
                      <span className="text-gray-500 text-sm">لا يوجد مدرسين</span>
                    )}
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <i className="fas fa-arrow-left"></i>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
