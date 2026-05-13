import React from 'react';
import { Icon } from '@/components/ui';

// Inline CountUp component
interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
}

const CountUp: React.FC<CountUpProps> = ({ end, prefix = '', suffix = '' }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    const duration = 1500; // 1.5 seconds
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * (end - startValue) + startValue);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end]);

  return <>{prefix}{count}{suffix}</>;
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: string;
  prefix?: string;
  suffix?: string;
  variant?: 'default' | 'centered';
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  prefix = '',
  suffix = '',
  variant = 'default',
  children,
}) => {
  const colorMap: Record<string, { gradient: string; text: string; glow: string }> = {
    primary: { gradient: 'from-indigo-500/20 to-blue-600/20', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    secondary: { gradient: 'from-emerald-500/20 to-teal-600/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    warning: { gradient: 'from-amber-500/20 to-orange-600/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    success: { gradient: 'from-green-500/20 to-emerald-600/20', text: 'text-green-400', glow: 'shadow-green-500/20' },
    danger: { gradient: 'from-rose-500/20 to-red-600/20', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
    info: { gradient: 'from-sky-500/20 to-cyan-600/20', text: 'text-sky-400', glow: 'shadow-sky-500/20' },
  };

  const theme = colorMap[color] || colorMap.primary;
  
  const iconName = React.useMemo(() => {
    const tokens = icon.trim().split(/\s+/).filter(Boolean);
    const iconToken = tokens.find((token) =>
      token.startsWith('fa-') &&
      ![
        'fa-solid',
        'fa-regular',
        'fa-brands',
        'fa-spin',
        'fa-pulse',
        'fa-fw',
      ].includes(token)
    );

    if (iconToken) {
      return iconToken.replace(/^fa-/, '');
    }

    return tokens[0] || icon;
  }, [icon]);

  if (variant === 'centered') {
    return (
      <div className="premium-glass p-8 rounded-3xl flex flex-col items-center justify-center text-center group border-white/5 hover:border-white/10 relative overflow-hidden">
        <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${theme.gradient} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`}></div>
        
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center mb-6 relative z-10 premium-border`}>
          <Icon name={iconName} size="xl" className={theme.text} />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
            {typeof value === 'number' ? (
              <CountUp end={value} prefix={prefix} suffix={suffix} />
            ) : (
              value
            )}
          </h3>
          <p className="text-gray-light font-medium tracking-wide uppercase text-xs sm:text-sm opacity-70 group-hover:opacity-100 transition-opacity">
            {title}
          </p>
        </div>

        {trend && (
          <div className="mt-4 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-semibold flex items-center gap-1.5">
            <span className={trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}>
              <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'}`}></i>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-light/60">{trend.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="premium-glass p-5 rounded-2xl flex items-center gap-4 group border-white/5 hover:border-white/10 relative overflow-hidden">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shrink-0 premium-border`}>
        <Icon name={iconName} className={theme.text} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-light uppercase tracking-wider mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {typeof value === 'number' ? (
            <CountUp end={value} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </h3>
      </div>

      {trend && (
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border border-white/5`}>
          {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
        </div>
      )}
      
      {children}
    </div>
  );
};
