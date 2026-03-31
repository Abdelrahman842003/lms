'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon } from '@/components/ui';
import type { TeacherAlert } from '@/types/teacher-report.types';

interface AlertsRecommendationsProps {
  alerts: TeacherAlert[];
  onDrilldown?: (key: string) => void;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2
};

const severityConfig = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-r-4 border-r-red-500',
    icon: 'alert-triangle',
    iconColor: 'text-red-400',
    label: 'حرج',
    labelBg: 'bg-red-500/20 text-red-400'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-r-4 border-r-yellow-500',
    icon: 'alert-circle',
    iconColor: 'text-yellow-400',
    label: 'تحذير',
    labelBg: 'bg-yellow-500/20 text-yellow-400'
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-r-4 border-r-blue-500',
    icon: 'info',
    iconColor: 'text-blue-400',
    label: 'معلومات',
    labelBg: 'bg-blue-500/20 text-blue-400'
  }
};

export default function AlertsRecommendations({ alerts, onDrilldown }: AlertsRecommendationsProps) {
  if (!alerts || alerts.length === 0) return null;

  const sorted = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );

  return (
    <DashboardCard title={`التنبيهات والتوصيات (${alerts.length})`} icon="bell" className="mb-6">
      <div className="space-y-3">
        {sorted.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
          return (
            <div
              key={alert.alert_key}
              className={`p-4 rounded-xl ${config.bg} ${config.border} flex items-start gap-3`}
            >
              <Icon name={config.icon} className={`${config.iconColor} text-xl mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.labelBg}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-white text-sm">{alert.message}</p>
                {alert.drilldown_key && onDrilldown && (
                  <button
                    onClick={() => onDrilldown(alert.drilldown_key!)}
                    className="text-primary text-xs mt-2 hover:underline"
                  >
                    عرض التفاصيل ←
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
