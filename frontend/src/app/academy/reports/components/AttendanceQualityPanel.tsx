'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon, LoadingSpinner } from '@/components/ui';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import type { AttendanceQuality as AttendanceQualityType } from '@/types/academyReport.types';

interface AttendanceQualityPanelProps {
  data: AttendanceQualityType | null;
  loading?: boolean;
}

export default function AttendanceQualityPanel({ data, loading }: AttendanceQualityPanelProps) {
  if (loading) {
    return (
      <DashboardCard title="جودة الحضور" icon="check-circle" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const rateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <DashboardCard title="جودة الحضور" icon="check-circle" className="mb-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <Icon name="percent" className="text-primary text-3xl" />
          <div>
            <span className="text-gray-400 text-sm block">نسبة الحضور العامة</span>
            <span className={`text-3xl font-bold ${rateColor(data.overall_rate)}`}>
              {data.overall_rate}%
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="trending-up" className="text-primary" />
            اتجاه الحضور عبر الوقت
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}%`, 'نسبة الحضور']}
              />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="chalkboard-teacher" className="text-primary" />
              الحضور حسب المعلم
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.by_teacher.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="teacher" tick={{ fill: '#e5e7eb', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'النسبة']}
                />
                <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3">أفضل المجموعات حضوراً</h3>
            <div className="space-y-2">
              {data.best_groups.map((group, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm">{group.group}</span>
                  <span className="text-green-400 font-semibold text-sm">{group.rate}%</span>
                </div>
              ))}
            </div>

            <h3 className="text-white text-sm font-semibold mt-4 mb-3">أضعف المجموعات حضوراً</h3>
            <div className="space-y-2">
              {data.weakest_groups.map((group, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm">{group.group}</span>
                  <span className="text-red-400 font-semibold text-sm">{group.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
