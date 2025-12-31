'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { NotificationsSection } from '@/components/dashboard/NotificationsSection';

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user, children, selectedChild, selectChild } = useAuth();

  const handleSelectChild = (child: typeof children[0]) => {
    selectChild(child);
    router.push(`/parent/${child.id}/summary`);
  };

  // Calculate statistics
  const totalChildren = children.length;
  const totalTeachers = children.reduce((acc, child) => {
    const teacherIds = new Set(child.teachers?.map(t => t.id) || []);
    return acc + teacherIds.size;
  }, 0);
  const activeChildren = children.filter(child => child.teachers && child.teachers.length > 0).length;

  return (
    <DashboardLayout
      role="parent"
      user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
    >
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          <StatCard
            title="إجمالي الأبناء"
            value={totalChildren}
            icon="fas fa-users"
            color="primary"
            variant="centered"
          />
          <StatCard
            title="أبناء نشطين"
            value={activeChildren}
            icon="fas fa-user-check"
            color="success"
            variant="centered"
          />
          <StatCard
            title="إجمالي المدرسين"
            value={totalTeachers}
            icon="fas fa-chalkboard-teacher"
            color="info"
            variant="centered"
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Children List */}
          <DashboardCard
            title="الأبناء"
            icon="fas fa-users"
          >
            {children.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-slash text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">لا يوجد أبناء مسجلين</h3>
                <p className="text-gray-400">لم يتم تسجيل أي طالب برقم هاتفك كولي أمر. تواصل مع المدرس لتسجيل رقمك.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={`group p-5 bg-white/5 rounded-xl border transition-all duration-300 cursor-pointer hover:bg-white/10 hover:border-primary/50 hover:-translate-y-1 ${
                      selectedChild?.id === child.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-white/10'
                    }`}
                    onClick={() => handleSelectChild(child)}
                  >
                    {/* Child Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                        {child.avatar ? (
                          <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-xl font-bold">
                            {child.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">{child.name}</h3>
                        {child.phone && (
                          <p className="text-sm text-gray-400 flex items-center gap-1.5">
                            <i className="fas fa-phone text-xs"></i>
                            {child.phone}
                          </p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-arrow-left text-primary"></i>
                      </div>
                    </div>

                    {/* Teachers Section */}
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-chalkboard-teacher text-primary text-sm"></i>
                        <span className="text-xs text-gray-400 font-medium">المدرسين المشتركين</span>
                      </div>
                      {child.teachers && child.teachers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {child.teachers.slice(0, 3).map((teacher) => (
                            <span
                              key={teacher.id}
                              className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full border border-primary/20"
                            >
                              {teacher.name}
                            </span>
                          ))}
                          {child.teachers.length > 3 && (
                            <span className="bg-white/5 text-gray-300 text-xs px-2.5 py-1 rounded-full border border-white/10">
                              +{child.teachers.length - 3} المزيد
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">لا يوجد مدرسين</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Notifications Section */}
          <NotificationsSection />
        </div>
      </div>
    </DashboardLayout>
  );
}
