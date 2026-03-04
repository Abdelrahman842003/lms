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
  className='',
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
        ...style
      }}
    />
  );
};

export default Skeleton;
