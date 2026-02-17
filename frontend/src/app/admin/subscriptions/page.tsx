'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { 
  SubscriptionFilters, 
  getSubscriptionTableColumns, 
  getSubscriptionTableActions,
  type Subscription 
} from '@/components/admin/subscriptions';

// Mock data removed

type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'all';
type EntityType = 'teacher' | 'academy' | 'all';

function SubscriptionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [stats, setStats] = React.useState({ total: 0, active: 0, trial: 0, expired: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<EntityType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, meta, stats } = await import('@/services/admin/adminService').then(m => m.getSubscriptions(
        currentPage,
        10,
        {
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined
        }
      ));
      
      // Cast the data to Subscription type
      const typedData = (data || []).map((item: any) => ({
        ...item,
        type: item.type as 'teacher' | 'academy',
        status: item.status as 'active' | 'trial' | 'expired',
      }));
      
      setSubscriptions(typedData);
      setStats(stats || { total: 0, active: 0, trial: 0, expired: 0 });
      setTotalPages(meta?.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setSubscriptions([]);
      setStats({ total: 0, active: 0, trial: 0, expired: 0 });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  // Get table columns and actions
  const columns = getSubscriptionTableColumns();
  const actions = getSubscriptionTableActions();
  
  return (
    <DashboardLayout role="admin" user={user || undefined}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">إدارة الاشتراكات</h1>
            <p className="text-gray-400">إدارة المدرسين والطلاب وحالات الباقات</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الاشتراكات"
            value={stats.total}
            icon="fas fa-users"
            trend={{ value: 0, label: 'مقارنة بالشهر الماضي', isPositive: true }}
            color="primary"
          />
          <StatCard
            title="باقات نشطة"
            value={stats.active}
            icon="fas fa-check-circle"
            trend={{ value: 0, label: 'مقارنة بالشهر الماضي', isPositive: true }}
            color="green"
          />
          <StatCard
            title="باقات تجريبية"
            value={stats.trial}
            icon="fas fa-flask"
            trend={{ value: 0, label: 'مقارنة بالشهر الماضي', isPositive: true }}
            color="blue"
          />
          <StatCard
            title="باقات منتهية"
            value={stats.expired}
            icon="fas fa-times-circle"
            trend={{ value: 0, label: 'مقارنة بالشهر الماضي', isPositive: false }}
            color="red"
          />
        </div>

        {/* Filters */}
        <DashboardCard>
          <SubscriptionFilters
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={(value) => setStatusFilter(value as SubscriptionStatus)}
            onTypeChange={(value) => setTypeFilter(value as EntityType)}
          />
        </DashboardCard>

        {/* Subscriptions Table */}
        <DataTable
          columns={columns}
          data={subscriptions}
          actions={actions}
          isLoading={loading}
          emptyMessage="لا توجد اشتراكات"
          pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(SubscriptionsPage);
