/**
 * Performance Monitor Stories
 * Stories for the performance monitoring component
 */

import PerformanceMonitor from './PerformanceMonitor';

export default {
  title: 'Monitoring/PerformanceMonitor',
  component: PerformanceMonitor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'مكون مراقبة الأداء يعرض مقاييس الأداء في الوقت الفعلي.',
      },
    },
  },
};

// Default state (minimized)
export const Minimized = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">مراقب الأداء - حالة مصغرة</h1>
      <p className="text-gray-600 mb-8">انقر على المراقب في الزاوية لتوسيعه</p>
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <p>محتوى الصفحة هنا...</p>
      </div>
    </div>
    <PerformanceMonitor enabled={true} minimized={true} />
  </div>
);

// Expanded state
export const Expanded = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">مراقب الأداء - حالة موسعة</h1>
      <p className="text-gray-600 mb-8">عرض تفصيلي لمقاييس الأداء</p>
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <p>محتوى الصفحة هنا...</p>
      </div>
    </div>
    <PerformanceMonitor enabled={true} minimized={false} />
  </div>
);

// Different positions
export const TopLeft = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">مراقب الأداء - الزاوية العلوية اليسرى</h1>
    </div>
    <PerformanceMonitor enabled={true} position="top-left" />
  </div>
);

export const TopRight = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">مراقب الأداء - الزاوية العلوية اليمنى</h1>
    </div>
    <PerformanceMonitor enabled={true} position="top-right" />
  </div>
);

export const BottomLeft = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">مراقب الأداء - الزاوية السفلية اليسرى</h1>
    </div>
    <PerformanceMonitor enabled={true} position="bottom-left" />
  </div>
);

// Disabled state (production simulation)
export const Disabled = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">الإنتاج - مراقب الأداء معطل</h1>
      <p className="text-gray-600 mb-8">في بيئة الإنتاج، لا يظهر مراقب الأداء</p>
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <p>محتوى الصفحة الأساسي...</p>
      </div>
    </div>
    <PerformanceMonitor enabled={false} />
  </div>
);