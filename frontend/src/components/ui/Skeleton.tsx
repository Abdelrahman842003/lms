'use client';

import React from 'react';

export interface SkeletonProps {
  width?: string;
  height?: string;
  minHeight?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  minHeight,
  borderRadius = '4px',
  className = '',
  style
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        minHeight,
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <div 
        className="skeleton-shimmer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          transform: 'translateX(-100%)',
          animation: 'skeletonShimmer 1.5s infinite',
        }}
      />
    </div>
  );
};

export default Skeleton;
