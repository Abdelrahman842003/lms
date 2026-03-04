'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AcademyStatsChartsProps {
  stats: {
    actual_revenue?: number;
    students_count: number;
    revenue_chart?: Array<{ label: string; revenue: number; month: string }>;
    revenue_trend?: Array<{ date: string; amount: number }>; // Keep for backward compatibility if needed
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="ux-bg-gray-900-90 ux-border ux-border-white-10 ux-p-3 ux-rounded-lg ux-shadow-xl ux-backdrop-blur-sm">
        <p className="ux-text-gray-300 ux-text-xs ux-mb-1">{label}</p>
        <p className="ux-text-white ux-font-bold ux-text-sm">
          {payload[0].value} ج.م
        </p>
      </div>
    );
  }
  return null;
};

export const AcademyStatsCharts: React.FC<AcademyStatsChartsProps> = ({ stats }) => {
  // Map backend data to chart format
  const data = stats.revenue_chart?.map(item => ({
    date: item.label, // Use Arabic label
    amount: Number(item.revenue) // Ensure number
  })) || stats.revenue_trend || [
    { date: 'يناير', amount: 0 },
    { date: 'فبراير', amount: 0 },
    { date: 'مارس', amount: 0 },
    { date: 'أبريل', amount: 0 },
    { date: 'مايو', amount: 0 },
    { date: 'يونيو', amount: 0 },
  ];

  return (
    <div className="ux-w-full">
      {/* Revenue Chart */}
      <div className="ux-bg-gray-900-50 ux-backdrop-blur-md ux-border ux-border-white-5 ux-rounded-2xl ux-p-6 ux-relative ux-overflow-hidden group ux-hover-border-white-10 ux-transition-all ux-duration-300">
        <div className="ux-absolute ux-top-0 ux-right-0 ux-w-32 ux-h-32 ux-bg-emerald-500-10 ux-rounded-full ux-blur-3xl ux-mr-16 ux-mt-16 ux-pointer-events-none"></div>
        
        <div className="ux-flex ux-justify-between ux-items-start ux-mb-6 ux-relative ux-z-10">
          <div>
            <h3 className="ux-text-lg ux-font-bold ux-text-white ux-mb-1">إحصائيات الإيرادات</h3>
            <p className="ux-text-gray-400 ux-text-xs">تطور الإيرادات خلال الأشهر الأخيرة</p>
          </div>
          <div className="ux-text-left">
            <span className="ux-text-2xl ux-font-bold ux-text-emerald-400">{stats.actual_revenue || 0} ج.م</span>
            <p className="ux-text-emerald-500-60 ux-text-10px ux-font-medium">الإجمالي</p>
          </div>
        </div>

        <div className="ux-h-200px ux-w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
