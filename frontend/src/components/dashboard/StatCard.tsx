import React from 'react';

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
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    success: { bg: 'bg-success/10', text: 'text-success' },
    danger: { bg: 'bg-danger/10', text: 'text-danger' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  };

  const theme = colorMap[color] || colorMap.primary;

  if (variant === 'centered') {
    return (
      <div className="bg-[#101426]/15 rounded-2xl p-[28px] border border-white/10 transition-all duration-500 ease-in-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:backdrop-blur-[20px] hover:border-[#1bc5f8]/50 group text-center">
        <i className={`${icon} text-[2.5rem] ${theme.text} mb-3 block transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}></i>
        <h3 className="text-[2rem] font-bold text-white mb-2">
          {typeof value === 'number' ? (
            <CountUp end={value} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </h3>
        <p className="text-gray-400 text-[0.95rem]">{title}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#101426]/15 rounded-2xl p-[28px] border border-white/10 transition-all duration-500 ease-in-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:backdrop-blur-[20px] hover:border-[#1bc5f8]/50 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-[0.9rem] mb-2 font-medium">{title}</p>
          <h3 className="text-[1.75rem] font-bold text-white">
            {typeof value === 'number' ? (
              <CountUp end={value} prefix={prefix} suffix={suffix} />
            ) : (
              value
            )}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center ${theme.text} text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <i className={icon}></i>
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 text-[0.85rem]">
          <span className={`${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1 font-medium`}>
            <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'}`}></i>
            <span>{Math.abs(trend.value)}%</span>
          </span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
      {children}
    </div>
  );
};
