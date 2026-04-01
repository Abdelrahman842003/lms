'use client';

import React from 'react';
import { Icon } from '@/components/ui';
import { directionIcon, directionColor } from '@/components/reports/utils';

interface KpiCardProps {
  title: string;
  currentValue: number;
  baselineValue?: number | null;
  changePct?: number | null;
  direction?: 'up' | 'down' | 'stable';
  statusColor?: string | null;
  note?: string | null;
  drilldownKey?: string | null;
  onDrilldown?: (key: string) => void;
  icon?: string;
}

const statusBorderColor = (color?: string | null) => {
  if (color === 'red') return 'border-red-500/40';
  if (color === 'warning') return 'border-yellow-500/40';
  if (color === 'success') return 'border-green-500/40';
  return 'border-white/10';
};

export default function KpiCard({
  title,
  currentValue,
  baselineValue,
  changePct,
  direction = 'stable',
  statusColor,
  note,
  drilldownKey,
  onDrilldown,
  icon,
}: KpiCardProps) {
  const isPercent = note === '%';
  const invertDirection = title.includes('غير') || title.includes('متبقي') || title.includes('متأخر');

  const content = (
    <div
      className={`p-4 bg-white/5 rounded-xl border ${statusBorderColor(statusColor)} hover:border-primary/30 transition-colors ${
        drilldownKey ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs">{title}</span>
        {icon && <Icon name={icon} className="text-primary text-lg" />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-white text-2xl font-bold">
          {isPercent ? `${currentValue}%` : currentValue.toLocaleString()}
        </span>
        {changePct !== null && changePct !== undefined && (
          <span className={`text-sm font-medium ${directionColor(direction, invertDirection)}`}>
            {directionIcon(direction)} {Math.abs(changePct).toFixed(1)}%
          </span>
        )}
      </div>
      {baselineValue !== null && baselineValue !== undefined && (
        <span className="text-gray-500 text-xs mt-1 block">
          السابق: {isPercent ? `${baselineValue}%` : baselineValue.toLocaleString()}
        </span>
      )}
    </div>
  );

  if (drilldownKey && onDrilldown) {
    return (
      <div
        onClick={() => onDrilldown(drilldownKey)}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDrilldown(drilldownKey);
          }
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
