/**
 * Performance Optimization Components
 * 
 * Enhanced components with React.memo, lazy loading,
 * and performance optimizations.
 */

import React, { memo, Suspense, lazy } from 'react';

// Loading spinner component
export const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Enhanced loading fallback with skeleton
export const LoadingSkeleton = memo(({ 
  lines = 3, 
  height = 'h-4',
  className = ''
}: {
  lines?: number;
  height?: string;
  className?: string;
}) => (
  <div className={`animate-pulse space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className={`bg-gray-300 dark:bg-gray-600 rounded ${height} ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
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
  errorFallback = <div className="text-red-500 p-4">خطأ في تحميل المحتوى</div>
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
    <tr className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
      {columns.map((column, index) => (
        <td key={column.key || index} className="px-4 py-3 text-sm">
          {column.render ? column.render(item[column.key], item) : item[column.key]}
        </td>
      ))}
      {onAction && (
        <td className="px-4 py-3 text-sm">
          <div className="flex space-x-2">
            <button
              onClick={() => onAction('view', item)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              عرض
            </button>
            <button
              onClick={() => onAction('edit', item)}
              className="text-green-600 hover:text-green-800 transition-colors"
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
  className = '', 
  loading = false 
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">
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
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
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
      className="overflow-auto"
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
  className = '',
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
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">جاري التحميل...</div>
        </div>
      )}
      <img
        src={hasError ? placeholder : src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
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