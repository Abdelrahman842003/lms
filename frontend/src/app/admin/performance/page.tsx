/**
 * Performance Dashboard Component
 * Comprehensive performance metrics and controls
 */

'use client';

import { useState } from 'react';
import { 
  usePerformanceMonitoring, 
  useMemoryMonitoring, 
  useBundleSize,
  useNetworkOptimization 
} from '@/hooks/usePerformance';

export default function PerformanceDashboard() {
  const [activeSection, setActiveSection] = useState<'overview' | 'metrics' | 'optimization' | 'tools'>('overview');
  
  const { metrics, isSupported, logPerformance, sendToAnalytics, getPerformanceGrade } = usePerformanceMonitoring();
  const memoryUsage = useMemoryMonitoring();
  const bundleSize = useBundleSize();
  const { connectionInfo, shouldPreload, shouldReduceQuality } = useNetworkOptimization();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500 bg-green-50 border-green-200';
    if (score >= 80) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMetricStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        if (value <= 2500) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
        if (value <= 4000) return { status: 'needs-improvement', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
      case 'fid':
        if (value <= 100) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
        if (value <= 300) return { status: 'needs-improvement', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
      case 'cls':
        if (value <= 0.1) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
        if (value <= 0.25) return { status: 'needs-improvement', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { status: 'unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const sections = [
    { key: 'overview', label: 'نظرة عامة', icon: '📊' },
    { key: 'metrics', label: 'المقاييس التفصيلية', icon: '📈' },
    { key: 'optimization', label: 'تحسينات', icon: '⚡' },
    { key: 'tools', label: 'أدوات', icon: '🛠️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة تحكم الأداء</h1>
          <p className="text-gray-600">مراقبة وتحسين أداء التطبيق في الوقت الفعلي</p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 space-x-reverse bg-gray-100 p-1 rounded-lg">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key as any)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === section.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="ml-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Performance Score */}
            <div className={`p-6 rounded-lg border-2 ${getScoreColor(metrics.score)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{metrics.score}</div>
                <div className="text-sm">نتيجة الأداء العام</div>
                <div className="text-xs mt-1">درجة: {getPerformanceGrade()}</div>
              </div>
            </div>

            {/* Core Web Vitals Summary */}
            {[
              { key: 'lcp', label: 'LCP', description: 'أكبر رسمة محتوى', value: metrics.lcp, unit: 'ms' },
              { key: 'fid', label: 'FID', description: 'تأخير الإدخال الأول', value: metrics.fid, unit: 'ms' },
              { key: 'cls', label: 'CLS', description: 'تحول التخطيط', value: metrics.cls, unit: '' }
            ].map(({ key, label, description, value, unit }) => {
              const status = value !== undefined ? getMetricStatus(key, value) : { color: 'text-gray-400', bg: 'bg-gray-100' };
              return (
                <div key={key} className={`p-6 rounded-lg border ${status.bg} border-gray-200`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${status.color}`}>
                      {value !== undefined ? `${Math.round(value)}${unit}` : 'N/A'}
                    </div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Metrics Section */}
        {activeSection === 'metrics' && (
          <div className="space-y-6">
            {/* Core Web Vitals */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">مقاييس الويب الأساسية (Core Web Vitals)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'lcp', label: 'أكبر رسمة محتوى (LCP)', value: metrics.lcp, unit: 'ms', good: 2500, poor: 4000 },
                  { key: 'fid', label: 'تأخير الإدخال الأول (FID)', value: metrics.fid, unit: 'ms', good: 100, poor: 300 },
                  { key: 'cls', label: 'تحول التخطيط (CLS)', value: metrics.cls, unit: '', good: 0.1, poor: 0.25 },
                  { key: 'fcp', label: 'أول رسمة محتوى (FCP)', value: metrics.fcp, unit: 'ms', good: 1800, poor: 3000 },
                  { key: 'ttfb', label: 'وقت البايت الأول (TTFB)', value: metrics.ttfb, unit: 'ms', good: 800, poor: 1800 },
                  { key: 'inp', label: 'التفاعل للرسمة التالية (INP)', value: metrics.inp, unit: 'ms', good: 200, poor: 500 }
                ].map(({ key, label, value, unit, good, poor }) => {
                  const status = value !== undefined ? getMetricStatus(key, value) : { color: 'text-gray-400', bg: 'bg-gray-100' };
                  return (
                    <div key={key} className={`p-4 rounded border ${status.bg}`}>
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      <div className={`text-xl font-bold ${status.color}`}>
                        {value !== undefined ? `${Math.round(value)}${unit}` : 'غير متاح'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        جيد: &lt;{good}{unit} | ضعيف: &gt;{poor}{unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Memory Usage */}
            {memoryUsage && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">استخدام الذاكرة</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">الذاكرة المستخدمة</div>
                    <div className="text-xl font-bold">{memoryUsage.usedJSHeapSize.toFixed(1)} MB</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">إجمالي الذاكرة</div>
                    <div className="text-xl font-bold">{memoryUsage.totalJSHeapSize.toFixed(1)} MB</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">حد الذاكرة</div>
                    <div className="text-xl font-bold">{memoryUsage.jsHeapSizeLimit.toFixed(1)} MB</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>نسبة الاستخدام</span>
                    <span>{((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Network Information */}
            {connectionInfo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">معلومات الشبكة</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">نوع الاتصال</div>
                    <div className="text-xl font-bold">{connectionInfo.effectiveType}</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">سرعة التنزيل</div>
                    <div className="text-xl font-bold">{connectionInfo.downlink} Mbps</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">زمن الاستجابة</div>
                    <div className="text-xl font-bold">{connectionInfo.rtt} ms</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">التحميل المسبق</div>
                    <div className={`text-xl font-bold ${shouldPreload ? 'text-green-600' : 'text-red-600'}`}>
                      {shouldPreload ? 'مفعل' : 'معطل'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optimization Section */}
        {activeSection === 'optimization' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">توصيات التحسين</h3>
              <div className="space-y-4">
                {metrics.score < 90 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-medium text-yellow-800">تحسينات مقترحة:</h4>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                      {metrics.lcp && metrics.lcp > 2500 && (
                        <li>• تحسين LCP: استخدم تحميل مسبق للصور الكبيرة</li>
                      )}
                      {metrics.fid && metrics.fid > 100 && (
                        <li>• تحسين FID: قلل من حجم JavaScript وتأخير التنفيذ</li>
                      )}
                      {metrics.cls && metrics.cls > 0.1 && (
                        <li>• تحسين CLS: احدد أبعاد الصور والإطارات مسبقاً</li>
                      )}
                    </ul>
                  </div>
                )}

                {shouldReduceQuality && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium text-blue-800">اتصال بطيء مكتشف</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      يُنصح بتقليل جودة الصور وتأخير تحميل المحتوى غير المهم
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">تحميل مسبق ذكي</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {shouldPreload ? 'مفعل - يتم تحميل الموارد مسبقاً' : 'معطل - اتصال بطيء مكتشف'}
                    </p>
                  </div>
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">ضغط الصور</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {shouldReduceQuality ? 'مفعل - جودة منخفضة للشبكات البطيئة' : 'عادي - جودة عالية'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools Section */}
        {activeSection === 'tools' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">أدوات التشخيص</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={logPerformance}
                  className="p-4 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">عرض المقاييس في الكونسول</div>
                  <div className="text-sm text-gray-600">طباعة جميع المقاييس المتاحة</div>
                </button>

                <button
                  onClick={sendToAnalytics}
                  className="p-4 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium">إرسال للتحليلات</div>
                  <div className="text-sm text-gray-600">إرسال البيانات لـ Google Analytics</div>
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="p-4 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-medium">إعادة تحميل</div>
                  <div className="text-sm text-gray-600">إعادة قياس الأداء</div>
                </button>
              </div>
            </div>

            {/* Bundle Information */}
            {bundleSize && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">معلومات الحزم</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">حجم إجمالي</div>
                    <div className="text-xl font-bold">{bundleSize.totalSize} MB</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">حجم مضغوط</div>
                    <div className="text-xl font-bold">{bundleSize.gzipSize} MB</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-gray-600">عدد القطع</div>
                    <div className="text-xl font-bold">{bundleSize.chunks.length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">حالة النظام</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>دعم Web Vitals:</span>
                  <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                    {isSupported ? '✓ مدعوم' : '✗ غير مدعوم'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Observer:</span>
                  <span className="text-green-600">✓ متاح</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory API:</span>
                  <span className={memoryUsage ? 'text-green-600' : 'text-red-600'}>
                    {memoryUsage ? '✓ متاح' : '✗ غير متاح'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network Information API:</span>
                  <span className={connectionInfo ? 'text-green-600' : 'text-red-600'}>
                    {connectionInfo ? '✓ متاح' : '✗ غير متاح'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}