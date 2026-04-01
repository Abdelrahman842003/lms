'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon, LoadingSpinner } from '@/components/ui';
import type { AcademyAlert } from '@/types/academyReport.types';

interface AlertsPanelProps {
  alerts: AcademyAlert[] | null;
  loading?: boolean;
}

const severityConfig = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'alert-triangle',
    iconColor: 'text-red-400',
    label: 'حرج',
    labelBg: 'bg-red-500/20 text-red-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: 'alert-circle',
    iconColor: 'text-yellow-400',
    label: 'تحذير',
    labelBg: 'bg-yellow-500/20 text-yellow-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'info',
    iconColor: 'text-blue-400',
    label: 'معلومات',
    labelBg: 'bg-blue-500/20 text-blue-400',
  },
};

export default function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
  if (loading) {
    return (
      <DashboardCard title="التنبيهات والإجراءات" icon="bell" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <DashboardCard title="التنبيهات والإجراءات" icon="bell" className="mb-6">
        <div className="flex flex-col items-center py-8 text-gray-400">
          <Icon name="check-circle" className="text-green-400 text-4xl mb-3" />
          <p className="text-sm">لا توجد تنبيهات حالياً - الأمور تسير بشكل جيد!</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={`التنبيهات والإجراءات (${alerts.length})`} icon="bell" className="mb-6">
      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;

          return (
            <div
              key={i}
              className={`p-4 rounded-xl border ${config.bg} ${config.border} flex items-start gap-3`}
            >
              <Icon name={config.icon} className={`${config.iconColor} text-xl mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.labelBg}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-white text-sm">{alert.message}</p>
                {alert.data && Object.keys(alert.data).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(alert.data).map(([key, value]) => (
                      <span key={key} className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
