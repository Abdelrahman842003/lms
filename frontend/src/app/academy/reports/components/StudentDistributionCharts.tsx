'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon, LoadingSpinner } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import type { StudentDistribution as StudentDistributionType } from '@/types/academyReport.types';

interface StudentDistributionChartsProps {
  data: StudentDistributionType | null;
  loading?: boolean;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9', '#7c3aed', '#9333ea'];

export default function StudentDistributionCharts({ data, loading }: StudentDistributionChartsProps) {
  if (loading) {
    return (
      <DashboardCard title="توزيع الطلاب" icon="pie-chart" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const activeVsInactiveData = [
    { name: 'نشط', value: data.active_vs_inactive.active, color: '#22c55e' },
    { name: 'غير نشط', value: data.active_vs_inactive.inactive, color: '#ef4444' },
  ];

  return (
    <DashboardCard title="توزيع الطلاب" icon="pie-chart" className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="layers" className="text-primary" />
            حسب المرحلة
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.by_grade} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis dataKey="grade" type="category" tick={{ fill: '#e5e7eb', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="user-check" className="text-primary" />
            نشط مقابل غير نشط
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={activeVsInactiveData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {activeVsInactiveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="users" className="text-primary" />
            حسب المعلم
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.by_teacher}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="teacher" tick={{ fill: '#e5e7eb', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="trending-up" className="text-primary" />
            الطلاب الجدد عبر الوقت
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.new_students_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
