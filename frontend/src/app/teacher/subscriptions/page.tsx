'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import api from '@/lib/axios';

interface SubscriptionDetail {
  month: string;
  month_name: string;
  student_name: string;
  student_phone: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  status: 'paid' | 'partial' | 'pending';
  status_label: string;
}

export default function StudentSubscriptionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<SubscriptionDetail[]>([]);
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionDetail | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teacher/reports/student-subscriptions', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      setDetails(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [startDate, endDate]);

  const filteredDetails = details.filter(detail => {
    const matchesSearch = detail.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.student_phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || detail.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">اشتراكات الطلاب</h1>
            <p className="text-gray-400 text-sm md:text-base">عرض تفاصيل اشتراكات الطلاب الشهرية</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-[#1e1e2d] px-3 py-2 rounded-lg border border-white/10 flex-1 md:flex-none">
              <span className="text-gray-400 text-sm whitespace-nowrap">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white outline-none text-sm w-full"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#1e1e2d] px-3 py-2 rounded-lg border border-white/10 flex-1 md:flex-none">
              <span className="text-gray-400 text-sm whitespace-nowrap">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white outline-none text-sm w-full"
              />
            </div>
          </div>
        </div>

        <DashboardCard title="تفاصيل الاشتراكات" icon="fas fa-file-invoice-dollar">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="بحث باسم الطالب أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#1e1e2d] text-white">الكل</option>
                <option value="paid" className="bg-[#1e1e2d] text-white">مدفوع</option>
                <option value="partial" className="bg-[#1e1e2d] text-white">مدفوع جزئياً</option>
                <option value="pending" className="bg-[#1e1e2d] text-white">غير مدفوع</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : filteredDetails.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#1e1e2d] z-10">
                  <tr className="border-b border-white/10">
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">الشهر</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">اسم الطالب</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium hidden md:table-cell">رقم الهاتف</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium hidden lg:table-cell">المستحق</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium hidden lg:table-cell">المدفوع</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">المتبقي</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetails.map((detail, index) => (
                    <tr 
                      key={`${detail.month}-${detail.student_phone}`} 
                      className={`
                        ${index < filteredDetails.length - 1 ? 'border-b border-white/5' : ''}
                        hover:bg-white/5 cursor-pointer transition-colors
                      `}
                      onClick={() => setSelectedSubscription(detail)}
                    >
                      <td className="py-3 px-4 text-white font-medium">{detail.month_name}</td>
                      <td className="py-3 px-4 text-white">{detail.student_name}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-sm hidden md:table-cell">{detail.student_phone}</td>
                      <td className="py-3 px-4 text-primary font-semibold hidden lg:table-cell">
                        {detail.amount_due?.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-success font-semibold hidden lg:table-cell">
                        {detail.amount_paid?.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-danger font-semibold hidden sm:table-cell">
                        {detail.amount_remaining?.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${
                          detail.status === 'paid' ? 'badge-success' : 
                          detail.status === 'partial' ? 'badge-warning' : 
                          'badge-danger'
                        }`}>
                          {detail.status_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">لا توجد بيانات للعرض</div>
          )}
        </DashboardCard>

        {/* Details Modal */}
        {selectedSubscription && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSubscription(null)}
          >
            <div 
              className="bg-[#1e1e2d] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">تفاصيل الاشتراك</h3>
                <button 
                  onClick={() => setSelectedSubscription(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">الشهر</span>
                  <span className="text-white font-medium">{selectedSubscription.month_name}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">الطالب</span>
                  <span className="text-white font-medium">{selectedSubscription.student_name}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">رقم الهاتف</span>
                  <span className="text-white font-mono">{selectedSubscription.student_phone}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-center border border-primary/20">
                    <div className="text-xs text-primary mb-1">المستحق</div>
                    <div className="font-bold text-white">{selectedSubscription.amount_due?.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg text-center border border-success/20">
                    <div className="text-xs text-success mb-1">المدفوع</div>
                    <div className="font-bold text-white">{selectedSubscription.amount_paid?.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-danger/10 rounded-lg text-center border border-danger/20">
                    <div className="text-xs text-danger mb-1">المتبقي</div>
                    <div className="font-bold text-white">{selectedSubscription.amount_remaining?.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg mt-2">
                  <span className="text-gray-400">الحالة</span>
                  <span className={`badge ${
                    selectedSubscription.status === 'paid' ? 'badge-success' : 
                    selectedSubscription.status === 'partial' ? 'badge-warning' : 
                    'badge-danger'
                  }`}>
                    {selectedSubscription.status_label}
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5">
                <button 
                  onClick={() => setSelectedSubscription(null)}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
