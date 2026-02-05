import React from 'react';

export interface Subscription {
  id: string;
  name: string;
  phone: string;
  teacher_name: string;
  academy_name?: string;
  subscription_plan: string;
  status: 'active' | 'trial' | 'expired';
  subscription_start: string;
  subscription_end: string;
  plan_expires_at?: string;
  subscription_fee?: number;
  notes?: string;
  is_trial: boolean;
  record_type?: 'student' | 'teacher';
}

export const getSubscriptionTableColumns = () => [
  {
    key: 'name',
    label: 'الاسم',
    sortable: true,
    render: (value: string, row: Subscription) => (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          row.record_type === 'teacher' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-400'
        }`}>
          {row.record_type === 'teacher' ? (
            <i className="fas fa-chalkboard-teacher text-xs"></i>
          ) : (
            value.charAt(0)
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{value}</span>
            {row.record_type === 'teacher' && (
              <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                مدرس
              </span>
            )}
          </div>
          {row.phone && <div className="text-xs text-gray-400">{row.phone}</div>}
        </div>
      </div>
    ),
  },
  {
    key: 'teacher_name',
    label: 'النوع',
    sortable: true,
    render: (value: string, row: Subscription) => (
      <div>
        {row.record_type === 'teacher' ? (
          <div>
            <div className="text-primary font-medium">مدرس مستقل</div>
            <div className="text-xs text-gray-400">{value}</div>
          </div>
        ) : (
          <div>
            <div className="text-purple-400 font-medium">طالب في أكاديمية</div>
            {row.academy_name ? (
              <div className="text-xs text-purple-300">{row.academy_name}</div>
            ) : (
              <div className="text-xs text-white">{value}</div>
            )}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'subscription_plan',
    label: 'حالة الدفع (الباقة)',
    sortable: true,
    render: (value: string) => {
      let color = '';
      let icon = '';
      
      switch (value) {
        case 'تجريبي':
          color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          icon = 'fa-flask';
          break;
        case '6 شهور':
          color = 'bg-green-500/10 text-green-400 border-green-500/20';
          icon = 'fa-calendar-alt';
          break;
        case '12 شهر':
          color = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
          icon = 'fa-calendar';
          break;
        case 'باقة مخصصة':
          color = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
          icon = 'fa-cog';
          break;
        default:
          color = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
          icon = 'fa-question';
      }
      
      return (
        <span className={`px-2 py-1 rounded text-xs border ${color}`}>
          <i className={`fas ${icon} mr-1`}></i>
          {value}
        </span>
      );
    },
  },
  {
    key: 'status',
    label: 'الحالة',
    sortable: true,
    render: (_: string, row: Subscription) => {
      if (row.is_trial) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <i className="fas fa-flask mr-1"></i>
            تجريبي
          </span>
        );
      }
      
      switch (row.status) {
        case 'active':
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              <i className="fas fa-check-circle mr-1"></i>
              نشط
            </span>
          );
        case 'expired':
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              <i className="fas fa-times-circle mr-1"></i>
              منتهي
            </span>
          );
        default:
          return null;
      }
    },
  },
  {
    key: 'subscription_fee',
    label: 'التكلفة التقديرية',
    sortable: true,
    render: (value: number) => {
      return (
        <span className="font-bold text-blue-400">
          {value ? value.toLocaleString() : '0'} ج.م
        </span>
      );
    },
  },
  {
    key: 'period',
    label: 'المدة المتبقية',
    sortable: false,
    render: (_: any, row: Subscription) => {
      const calculateRemaining = () => {
        // Use subscription_end for students, plan_expires_at for teachers
        const endDateStr = row.subscription_end || row.plan_expires_at;
        
        if (!endDateStr) {
          return null;
        }
        
        try {
          const today = new Date();
          const endDate = new Date(endDateStr);
          
          // Validate date
          if (isNaN(endDate.getTime())) {
            return null;
          }
          
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          return { text: 'منتهي', days: diffDays, color: 'text-red-400', bg: 'bg-red-500/10' };
        } else if (diffDays === 0) {
          return { text: 'ينتهي اليوم', days: 0, color: 'text-orange-400', bg: 'bg-orange-500/10' };
        } else if (diffDays < 7) {
          return { text: `${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`, days: diffDays, color: 'text-red-400', bg: 'bg-red-500/10' };
        } else if (diffDays < 30) {
          return { text: `${diffDays} يوم`, days: diffDays, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        } else if (diffDays < 60) {
          const months = Math.floor(diffDays / 30);
          const days = diffDays % 30;
          const text = days > 0 ? `${months} شهر و ${days} يوم` : `${months} شهر`;
          return { text, days: diffDays, color: 'text-green-400', bg: 'bg-green-500/10' };
        } else {
          const months = Math.floor(diffDays / 30);
          return { text: `${months} شهر`, days: diffDays, color: 'text-green-400', bg: 'bg-green-500/10' };
        }
        } catch (error) {
          return null;
        }
      };

      const remaining = calculateRemaining();
      
      return (
        <div className="text-sm">
          {remaining ? (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${remaining.bg}`}>
              <i className={`fas fa-clock ${remaining.color} text-xs`}></i>
              <span className={`font-medium ${remaining.color}`}>
                {remaining.text}
              </span>
            </div>
          ) : (
            <span className="text-gray-500">-</span>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {(row.subscription_end || row.plan_expires_at) ? 
              `ينتهي: ${new Date(row.subscription_end || row.plan_expires_at || '').toLocaleDateString('ar-EG')}` : 
              '-'}
          </div>
        </div>
      );
    },
  },
];

export const getSubscriptionTableActions = () => [
  {
    label: 'تعديل',
    icon: 'fas fa-edit',
    variant: 'default' as const,
    onClick: () => {},
  },
  {
    label: 'تجديد',
    icon: 'fas fa-sync',
    variant: 'success' as const,
    onClick: () => {},
  },
];
