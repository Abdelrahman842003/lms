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
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface TeacherStatsChartsProps {
  stats: {
    averageAttendance: number;
    averageExamScore: number;
    attendanceTrend: Array<{ date: string; rate: number }>;
    examPerformanceTrend: Array<{ title: string; average: number }>;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-gray-300 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export const TeacherStatsCharts: React.FC<TeacherStatsChartsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Attendance Chart */}
      <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">إحصائيات الحضور</h3>
            <p className="text-gray-400 text-xs">تطور نسبة الحضور في آخر 7 محاضرات</p>
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold text-emerald-400">{stats.averageAttendance}%</span>
            <p className="text-emerald-500/60 text-[10px] font-medium">المتوسط العام</p>
          </div>
        </div>

        <div className="h-[200px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.attendanceTrend}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="rate" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAttendance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exam Performance Chart */}
      <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">أداء الامتحانات</h3>
            <p className="text-gray-400 text-xs">متوسط الدرجات في آخر 5 امتحانات</p>
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold text-purple-400">{stats.averageExamScore}%</span>
            <p className="text-purple-500/60 text-[10px] font-medium">المتوسط العام</p>
          </div>
        </div>

        <div className="h-[200px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.examPerformanceTrend} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="title" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={10}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                {stats.examPerformanceTrend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#a78bfa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
