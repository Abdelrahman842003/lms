'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Icon } from '@/components/ui';

interface GaugeProps {
  percentage: number;
  label: string;
  subLabel: string;
  icon: string;
  color: string;
  glowColor: string;
}

const UsageGauge: React.FC<GaugeProps> = ({ percentage, label, subLabel, icon, color, glowColor }) => {
  const data = [
    { name: 'Used', value: Math.min(percentage, 100) },
    { name: 'Remaining', value: Math.max(0, 100 - percentage) },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-full aspect-square max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              startAngle={225}
              endAngle={-45}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
              <Cell fill="rgba(255, 255, 255, 0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pb-2">
          <div className={`w-10 h-10 rounded-2xl mb-1 flex items-center justify-center`} style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}>
            <Icon name={icon} className="text-xl" />
          </div>
          <span className="text-2xl font-black text-white">{percentage}%</span>
          <span className="text-[10px] font-bold text-gray-light/40 uppercase tracking-widest">{label}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-light/60">{subLabel}</p>
      </div>
    </div>
  );
};

interface SubscriptionUsageGaugesProps {
  seats: { used: number; limit: number; percentage: number; isUnlimited?: boolean };
  storage: { used: number; limit: number; percentage: number };
  delivery: { used: number; limit: number; percentage: number };
}

export const SubscriptionUsageGauges: React.FC<SubscriptionUsageGaugesProps> = ({ seats, storage, delivery }) => {
  return (
    <div className="premium-glass premium-border rounded-[2.5rem] p-8 space-y-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <h2 className="text-xl font-black text-white flex items-center gap-3">
          <Icon name="chart-pie" className="text-primary" />
          نظرة عامة على الاستهلاك
        </h2>
        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-light/60 uppercase tracking-tighter">
          مؤشرات الأداء اللحظية
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <UsageGauge
          percentage={seats.percentage}
          label="الكراسي"
          subLabel={`${seats.used} / ${seats.isUnlimited ? '∞' : seats.limit} طالب`}
          icon="user-graduate"
          color="#3b82f6" // blue-500
          glowColor="rgba(59, 130, 246, 0.5)"
        />
        <UsageGauge
          percentage={delivery.percentage}
          label="المشاهدات"
          subLabel={`${delivery.used} / ${delivery.limit} دقيقة`}
          icon="play-circle"
          color="#a855f7" // purple-500
          glowColor="rgba(168, 85, 247, 0.5)"
        />
        <UsageGauge
          percentage={storage.percentage}
          label="التخزين"
          subLabel={`${storage.used} / ${storage.limit} دقيقة`}
          icon="cloud-upload-alt"
          color="#10b981" // emerald-500
          glowColor="rgba(16, 185, 129, 0.5)"
        />
      </div>
    </div>
  );
};
