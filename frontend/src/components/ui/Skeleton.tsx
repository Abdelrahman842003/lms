'use client';

import React from 'react';
import { clsx } from 'clsx';

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
  borderRadius = '12px',
  className='',
  style
}) => {
  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-white/5 premium-border animate-pulse',
        className
      )}
      style={{
        width,
        height,
        minHeight,
        borderRadius,
        ...style
      }}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]"></div>
    </div>
  );
};

export default Skeleton;
