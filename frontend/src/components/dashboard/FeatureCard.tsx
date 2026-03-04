import React from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color?: 'primary' | 'secondary' | 'warning' | 'success' | 'danger' | 'info';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  href,
  color = 'primary',
}) => {
  const colorMap: Record<string, { className: string }> = {
    primary: { 
      className: 'feature-icon-primary'
    },
    secondary: { 
      className: 'feature-icon-secondary'
    },
    warning: { 
      className: 'feature-icon-warning'
    },
    success: { 
      className: 'feature-icon-success'
    },
    danger: { 
      className: 'feature-icon-danger'
    },
    info: { 
      className: 'feature-icon-info'
    },
  };

  const theme = colorMap[color] || colorMap.primary;

  return (
    <Link href={href} className="feature-card dashboard-feature-card">
      <div className="dashboard-feature-content">
        <div className={`dashboard-feature-icon ${theme.className}`}>
          <i className={icon}></i>
        </div>
        <div>
          <h3 className="feature-title">{title}</h3>
          <p className="feature-description">{description}</p>
        </div>
      </div>
    </Link>
  );
};
