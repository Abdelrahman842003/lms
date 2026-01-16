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
      <div className="bg-gray-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-gray-300 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
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
    <div className="w-full">
      {/* Revenue Chart */}
      <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">إحصائيات الإيرادات</h3>
            <p className="text-gray-400 text-xs">تطور الإيرادات خلال الأشهر الأخيرة</p>
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold text-emerald-400">{stats.actual_revenue || 0} ج.م</span>
            <p className="text-emerald-500/60 text-[10px] font-medium">الإجمالي</p>
          </div>
        </div>

        <div className="h-[200px] w-full" dir="ltr">
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
