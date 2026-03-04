/**
 * Performance Optimization Components
 * 
 * Enhanced components with React.memo, lazy loading,
 * and performance optimizations.
 */

import React, { memo, Suspense, lazy } from 'react';

// Loading spinner component
export const LoadingSpinner = memo(() => (
  <div className="ux-flex ux-items-center ux-justify-center ux-p-8">
    <LoadingSpinner size="md" color="primary" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Enhanced loading fallback with skeleton
export const LoadingSkeleton = memo(({ 
  lines = 3, 
  height = 'ux-h-4',
  className=''
}: {
  lines?: number;
  height?: string;
  className?: string;
}) => (
  <div className={`ux-animate-pulse ux-space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className={`ux-bg-gray-300 ux-dark-bg-gray-600 ux-rounded ${height} ${
          index === lines - 1 ? 'ux-w-3-4' : 'ux-w-full'
        }`}
      />
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Lazy-loaded route components
export const LazyDashboardRoutes = {
  // Teacher routes
  TeacherDashboard: lazy(() => import('@/app/teacher/dashboard/page')),
  TeacherStudents: lazy(() => import('@/app/teacher/students/page')),
  TeacherExams: lazy(() => import('@/app/teacher/exams/page')),
  TeacherGrades: lazy(() => import('@/app/teacher/grades/page')),
  TeacherLectures: lazy(() => import('@/app/teacher/lectures/page')),
  TeacherReports: lazy(() => import('@/app/teacher/reports/page')),
  
  // Student routes
  StudentDashboard: lazy(() => import('@/app/student/dashboard/page')),
  StudentExams: lazy(() => import('@/app/student/exams/page')),
  StudentLectures: lazy(() => import('@/app/student/lectures/page')),
  StudentTeachers: lazy(() => import('@/app/student/teachers/page')),
  
  // Admin routes
  AdminDashboard: lazy(() => import('@/app/admin/dashboard/page')),
  AdminUsers: lazy(() => import('@/app/admin/users/page')),
  AdminAcademies: lazy(() => import('@/app/admin/academies/page')),
  AdminReports: lazy(() => import('@/app/admin/reports/page')),
  
  // Academy routes
  AcademyDashboard: lazy(() => import('@/app/academy/dashboard/page')),
  AcademyTeachers: lazy(() => import('@/app/academy/teachers/page')),
  AcademyStudents: lazy(() => import('@/app/academy/students/page')),
  
  // Parent routes
  ParentDashboard: lazy(() => import('@/app/parent/dashboard/page')),
  ParentChildren: lazy(() => import('@/app/parent/children/page')),
};

// Lazy wrapper with error boundary
export const LazyWrapper = memo(({ 
  children, 
  fallback = <LoadingSkeleton />,
  errorFallback = <div className="ux-text-red-500 ux-p-4">خطأ في تحميل المحتوى</div>
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback}>
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  </Suspense>
));

LazyWrapper.displayName = 'LazyWrapper';

// Memoized data table row for better list performance
export const DataTableRow = memo(({ 
  item, 
  columns, 
  onAction,
  isSelected = false 
}: {
  item: any;
  columns: any[];
  onAction?: (action: string, item: any) => void;
  isSelected?: boolean;
}) => {
  return (
    <tr className={`${isSelected ? 'ux-bg-blue-50' : 'ux-hover-bg-gray-50'} ux-transition-colors`}>
      {columns.map((column, index) => (
        <td key={column.key || index} className="ux-px-4 ux-py-3 ux-text-sm">
          {column.render ? column.render(item[column.key], item) : item[column.key]}
        </td>
      ))}
      {onAction && (
        <td className="ux-px-4 ux-py-3 ux-text-sm">
          <div className="ux-flex ux-space-x-2">
            <button
              onClick={() => onAction('view', item)}
              className="ux-text-blue-600 ux-hover-text-blue-800 ux-transition-colors"
            >
              عرض
            </button>
            <button
              onClick={() => onAction('edit', item)}
              className="ux-text-green-600 ux-hover-text-green-800 ux-transition-colors"
            >
              تعديل
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

DataTableRow.displayName = 'DataTableRow';

// Memoized card component
export const MemoCard = memo(({
  title,
  children,
  className='',
  loading = false
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}) => (
  <div className={`ux-bg-white ux-dark-bg-gray-800 ux-rounded-lg ux-shadow-sm ux-border ux-border-gray-200 ux-dark-border-gray-700 ${className}`}>
    {title && (
      <div className="ux-px-6 ux-py-4 ux-border-b ux-border-gray-200 ux-dark-border-gray-700">
        <h3 className="ux-text-lg ux-font-semibold ux-text-gray-900 ux-dark-text-white">
          {title}
        </h3>
      </div>
    )}
    <div className="ux-p-6">
      {loading ? <LoadingSkeleton lines={3} /> : children}
    </div>
  </div>
));

MemoCard.displayName = 'MemoCard';

// Memoized stat card
export const StatCard = memo(({ 
  title, 
  value, 
  icon, 
  trend,
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) => {
  const colorClasses = {
    blue: 'ux-bg-blue-500',
    green: 'ux-bg-green-500',
    red: 'ux-bg-red-500',
    yellow: 'ux-bg-yellow-500',
    purple: 'ux-bg-purple-500',
  };

  return (
    <div className="ux-bg-white ux-dark-bg-gray-800 ux-rounded-lg ux-shadow-sm ux-border ux-border-gray-200 ux-dark-border-gray-700 ux-p-6">
      <div className="ux-flex ux-items-center ux-justify-between">
        <div>
          <p className="ux-text-sm ux-font-medium ux-text-gray-600 ux-dark-text-gray-400 ux-mb-1">
            {title}
          </p>
          <p className="ux-text-2xl ux-font-bold ux-text-gray-900 ux-dark-text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={`ux-text-xs ux-mt-1 ${
              trend.isPositive ? 'ux-text-green-600' : 'ux-text-red-600'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`ux-p-3 ux-rounded-full ${colorClasses[color]} ux-text-white`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Virtualized list for large datasets
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 60,
  containerHeight = 400 
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div
      style={{ height: containerHeight }}
      className="ux-overflow-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Image with lazy loading and optimization
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  width, 
  height, 
  className='',
  placeholder = '/placeholder.jpg' 
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  
  return (
    <div className={`ux-relative ux-overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="ux-absolute ux-inset-0 ux-bg-gray-200 ux-animate-pulse ux-flex ux-items-center ux-justify-center">
          <div className="ux-text-gray-400 ux-text-xs">جاري التحميل...</div>
        </div>
      )}
      <img
        src={hasError ? placeholder : src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={`ux-transition-opacity ux-duration-300 ${
          isLoaded ? 'ux-opacity-100' : 'ux-opacity-0'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default {
  LoadingSpinner,
  LoadingSkeleton,
  LazyDashboardRoutes,
  LazyWrapper,
  DataTableRow,
  MemoCard,
  StatCard,
  VirtualizedList,
  OptimizedImage,
};
