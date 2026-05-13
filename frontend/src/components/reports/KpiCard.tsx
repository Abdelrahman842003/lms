'use client';

import React from 'react';
import { Icon } from '@/components/ui';
import { directionIcon, directionColor } from '@/components/reports/utils';
import { cn } from '@/utils';

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

const statusGlow = (color?: string | null) => {
  if (color === 'red') return 'shadow-[0_0_15px_rgba(239,68,68,0.1)] border-red-500/20';
  if (color === 'warning') return 'shadow-[0_0_15px_rgba(234,179,8,0.1)] border-yellow-500/20';
  if (color === 'success') return 'shadow-[0_0_15px_rgba(34,197,94,0.1)] border-success/20';
  return 'border-white/5';
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
      className={cn(
        "p-4 md:p-5 premium-glass premium-border rounded-2xl transition-all relative overflow-hidden group",
        statusGlow(statusColor),
        drilldownKey ? 'cursor-pointer active:scale-95' : ''
      )}
      onClick={drilldownKey && onDrilldown ? () => onDrilldown(drilldownKey) : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-light/30 text-[10px] font-black uppercase tracking-widest">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <Icon name={icon} size="sm" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-white text-2xl font-black tracking-tight">
            {isPercent ? `${currentValue}%` : currentValue.toLocaleString()}
          </span>
          {changePct !== null && changePct !== undefined && (
            <span className={cn("text-[10px] font-black flex items-center gap-0.5", directionColor(direction, invertDirection))}>
              {directionIcon(direction)} {Math.abs(changePct).toFixed(1)}%
            </span>
          )}
        </div>
        
        {baselineValue !== null && baselineValue !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-bold text-gray-light/10 uppercase tracking-widest">السابق</span>
            <span className="text-[10px] font-medium text-gray-light/20">
              {isPercent ? `${baselineValue}%` : baselineValue.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Decorative Gradient */}
      <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-primary/5 blur-xl rounded-full" />
    </div>
  );

  return content;
}
