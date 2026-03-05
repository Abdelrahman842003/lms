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
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'stat-icon-primary', text: 'stat-text-primary' },
    secondary: { bg: 'stat-icon-secondary', text: 'stat-text-secondary' },
    warning: { bg: 'stat-icon-warning', text: 'stat-text-warning' },
    success: { bg: 'stat-icon-success', text: 'stat-text-success' },
    danger: { bg: 'stat-icon-danger', text: 'stat-text-danger' },
    info: { bg: 'stat-icon-info', text: 'stat-text-info' },
    blue: { bg: 'stat-icon-info', text: 'stat-text-info' },
    green: { bg: 'stat-icon-success', text: 'stat-text-success' },
    red: { bg: 'stat-icon-danger', text: 'stat-text-danger' },
    purple: { bg: 'stat-icon-primary', text: 'stat-text-primary' },
  };

  const theme = colorMap[color] || colorMap.primary;
  const normalizedIconClass = React.useMemo(() => {
    const trimmedIcon = icon.trim();
    if (!trimmedIcon) return '';

    if (trimmedIcon.includes('fa-')) {
      const hasPrefix = /(^|\s)(fa[srbld]?|fa-solid|fa-regular|fa-brands)(\s|$)/.test(trimmedIcon);
      return hasPrefix ? trimmedIcon : `fas ${trimmedIcon}`;
    }

    return `fas fa-${trimmedIcon}`;
  }, [icon]);

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
      <div className="stat-card stat-card-centered">
        <Icon name={iconName} size="2x" className={`stat-card-centered-icon ${theme.text}`} />
        <h3 className="stat-card-centered-value">
          {typeof value === 'number' ? (
            <CountUp end={value} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </h3>
        <p className="stat-card-centered-title">{title}</p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="stat-card-main-row">
        <div>
          <p className="stat-card-label">{title}</p>
          <h3 className="stat-card-main-value">
            {typeof value === 'number' ? (
              <CountUp end={value} prefix={prefix} suffix={suffix} />
            ) : (
              value
            )}
          </h3>
        </div>
        <div className={`stat-card-main-icon ${theme.bg} ${theme.text}`}>
          <i className={normalizedIconClass}></i>
        </div>
      </div>
      {trend && (
        <div className="stat-card-trend-row">
          <span className={`stat-card-trend-icon ${trend.isPositive ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'}`}></i>
            <span>{Math.abs(trend.value)}</span>
          </span>
          <span className="stat-card-trend-label">{trend.label}</span>
        </div>
      )}
      {children}
    </div>
  );
};
