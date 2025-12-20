'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { getGroup, Group } from '@/services/groupService';

export default function GroupDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchGroupDetails(params.id as string);
    }
  }, [params.id]);

  const fetchGroupDetails = async (id: string) => {
    try {
      const data = await getGroup(id);
      setGroup(data.group);
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = [
    { key: 'name', label: 'اسم الطالب', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'parent_phone', label: 'رقم ولي الأمر', sortable: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131b2c]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131b2c] text-white">
        Group not found
      </div>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
      headerActions={
        <button onClick={() => router.back()} className="btn btn-secondary">
          <i className="fas fa-arrow-right ml-2"></i>
          رجوع
        </button>
      }
    >
      {/* Group Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard 
          title="اسم المجموعة" 
          value={group.name} 
          icon="fas fa-layer-group" 
          color="primary" 
        />
        <StatCard 
          title="الصف الدراسي" 
          value={group.grade_name || '-'} 
          icon="fas fa-graduation-cap" 
          color="secondary" 
        />
        <StatCard 
          title="عدد الطلاب" 
          value={students.length} 
          icon="fas fa-users" 
          color="warning" 
        />
        <StatCard 
          title="الموعد" 
          value={group.time || '-'} 
          icon="fas fa-clock" 
          color="danger" 
        />
      </div>

      {/* Students Table */}
      <DashboardCard
        title="طلاب المجموعة"
        icon="fas fa-users"
      >
        <DataTable 
          columns={tableColumns} 
          data={students} 
          searchable={true} 
          pagination={true} 
          itemsPerPage={10} 
        />
      </DashboardCard>
    </DashboardLayout>
  );
}
