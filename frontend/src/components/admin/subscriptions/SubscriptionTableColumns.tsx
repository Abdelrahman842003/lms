import React from 'react';

export interface Subscription {
  id: string;
  name: string;
  type: 'teacher' | 'academy';
  status: 'active' | 'trial' | 'expired';
  plan: string;
  expires_at?: string;
  // Legacy fields for backward compatibility
  phone?: string;
  teacher_name?: string;
  academy_name?: string;
  subscription_plan?: string;
  subscription_start?: string;
  subscription_end?: string;
  plan_expires_at?: string;
  subscription_fee?: number;
  notes?: string;
  is_trial?: boolean;
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
          row.type === 'teacher' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-400'
        }`}>
          {row.type === 'teacher' ? (
            <i className="fas fa-chalkboard-teacher text-xs"></i>
          ) : row.type === 'academy' ? (
            <i className="fas fa-building text-xs"></i>
          ) : (
            value.charAt(0)
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{value}</span>
            {row.type === 'teacher' && (
              <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                مدرس
              </span>
            )}
            {row.type === 'academy' && (
              <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                أكاديمية
              </span>
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'النوع',
    sortable: true,
    render: (value: string, row: Subscription) => (
      <div>
        {value === 'teacher' ? (
          <div>
            <div className="text-primary font-medium">مدرس مستقل</div>
            <div className="text-xs text-gray-400">Teacher</div>
          </div>
        ) : value === 'academy' ? (
          <div>
            <div className="text-green-400 font-medium">أكاديمية</div>
            <div className="text-xs text-gray-400">Academy</div>
          </div>
        ) : (
          <div className="text-gray-400">-</div>
        )}
      </div>
    ),
  },
  {
    key: 'plan',
    label: 'حالة الباقة',
    sortable: true,
    render: (value: string) => {
      let color = '';
      let icon = '';
      let text = value;
      
      switch (value) {
        case 'trial':
          color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          icon = 'fa-flask';
          text = 'تجريبي';
          break;
        case 'fixed':
        case 'term':
          color = 'bg-green-500/10 text-green-400 border-green-500/20';
          icon = 'fa-calendar-alt';
          text = 'مدة ثابتة';
          break;
        case 'custom':
          color = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
          icon = 'fa-cog';
          text = 'مخصصة';
          break;
        case 'none':
        default:
          color = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
          icon = 'fa-question';
          text = 'غير محدد';
      }
      
      return (
        <span className={`px-2 py-1 rounded text-xs border ${color}`}>
          <i className={`fas ${icon} mr-1`}></i>
          {text}
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
    key: 'expires_at',
    label: 'تاريخ الانتهاء',
    sortable: true,
    render: (value: string) => {
      if (!value) return <span className="text-gray-400">-</span>;
      return <span className="text-gray-300">{new Date(value).toLocaleDateString('ar-EG')}</span>;
    },
  },
  {
    key: 'period',
    label: 'المدة المتبقية',
    sortable: false,
    render: (_: any, row: Subscription) => {
      const calculateRemaining = () => {
        // Use expires_at for new API, fallback to legacy fields
        const endDateStr = row.expires_at || row.subscription_end || row.plan_expires_at;
        
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
