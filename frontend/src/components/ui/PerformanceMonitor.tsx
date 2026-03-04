/**
 * Performance Monitor Component
 * Real-time performance metrics display for development
 */

'use client';

import { useState } from 'react';
import { 
  usePerformanceMonitoring, 
  useMemoryMonitoring, 
  useBundleSize,
  useNetworkOptimization 
} from '@/hooks/usePerformance';

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
}

export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  minimized: initialMinimized = true 
}: PerformanceMonitorProps) {
  const [minimized, setMinimized] = useState(initialMinimized);
  const [activeTab, setActiveTab] = useState<'vitals' | 'memory' | 'network' | 'bundle'>('vitals');
  
  const { metrics, isSupported, getPerformanceGrade } = usePerformanceMonitoring();
  const memoryUsage = useMemoryMonitoring();
  const bundleSize = useBundleSize();
  const { connectionInfo, shouldPreload } = useNetworkOptimization();

  // Auto-hide in production unless explicitly enabled
  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'ux-top-4 ux-left-4',
    'top-right': 'ux-top-4 ux-right-4',
    'bottom-left': 'ux-bottom-4 ux-left-4',
    'bottom-right': 'ux-bottom-4 ux-right-4',
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'ux-text-green-500';
    if (score >= 80) return 'ux-text-yellow-500';
    if (score >= 70) return 'ux-text-orange-500';
    return 'ux-text-red-500';
  };

  const getMetricColor = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        if (value <= 2500) return 'ux-text-green-500';
        if (value <= 4000) return 'ux-text-yellow-500';
        return 'ux-text-red-500';
      case 'fid':
        if (value <= 100) return 'ux-text-green-500';
        if (value <= 300) return 'ux-text-yellow-500';
        return 'ux-text-red-500';
      case 'cls':
        if (value <= 0.1) return 'ux-text-green-500';
        if (value <= 0.25) return 'ux-text-yellow-500';
        return 'ux-text-red-500';
      case 'fcp':
        if (value <= 1800) return 'ux-text-green-500';
        if (value <= 3000) return 'ux-text-yellow-500';
        return 'ux-text-red-500';
      default:
        return 'ux-text-gray-300';
    }
  };

  // Helper function for formatting bytes (currently unused but useful for future enhancements)
  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  if (minimized) {
    return (
      <div 
        className={`ux-fixed ${positionClasses[position]} ux-z-50 ux-bg-gray-900 ux-border ux-border-gray-700 ux-rounded-lg ux-p-2 ux-cursor-pointer ux-hover-bg-gray-800 ux-transition-colors`}
        onClick={() => setMinimized(false)}
      >
        <div className="ux-flex ux-items-center ux-space-x-2 ux-text-xs">
          <div className="ux-w-2 ux-h-2 ux-bg-green-400 ux-rounded-full ux-animate-pulse"></div>
          <span className="ux-text-gray-300">Perf</span>
          <span className={getScoreColor(metrics.score)}>{metrics.score}</span>
          <span className="ux-text-gray-400">({getPerformanceGrade()})</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`ux-fixed ${positionClasses[position]} ux-z-50 ux-bg-gray-900 ux-border ux-border-gray-700 ux-rounded-lg ux-shadow-xl ux-w-80 ux-max-h-96 ux-overflow-hidden`}
      dir="ltr"
    >
      {/* Header */}
      <div className="ux-flex ux-items-center ux-justify-between ux-p-3 ux-bg-gray-800 ux-border-b ux-border-gray-700">
        <div className="ux-flex ux-items-center ux-space-x-2">
          <div className={`ux-w-2 ux-h-2 ux-rounded-full ${isSupported ? 'ux-bg-green-400' : 'badge-warning'} ux-animate-pulse`}></div>
          <h3 className="ux-text-sm ux-font-medium ux-text-gray-200">Performance Monitor</h3>
        </div>
        <div className="ux-flex ux-items-center ux-space-x-2">
          <span className={`ux-text-lg ux-font-bold ${getScoreColor(metrics.score)}`}>
            {metrics.score}
          </span>
          <button
            onClick={() => setMinimized(true)}
            className="ux-text-gray-400 ux-hover-text-gray-200 ux-text-lg ux-leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ux-flex ux-border-b ux-border-gray-700">
        {[
          { key: 'vitals', label: 'Vitals' },
          { key: 'memory', label: 'Memory' },
          { key: 'network', label: 'Network' },
          { key: 'bundle', label: 'Bundle' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`ux-flex-1 ux-px-3 ux-py-2 ux-text-xs ux-font-medium ux-transition-colors ${
              activeTab === tab.key
                ? 'ux-bg-blue-600 ux-text-white'
                : 'ux-bg-gray-800 ux-text-gray-400 ux-hover-text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ux-p-3 ux-max-h-64 ux-overflow-y-auto">
        {/* Core Web Vitals Tab */}
        {activeTab === 'vitals' && (
          <div className="ux-space-y-2">
            {[
              { key: 'lcp', label: 'LCP', value: metrics.lcp, unit: 'ms' },
              { key: 'fid', label: 'FID', value: metrics.fid, unit: 'ms' },
              { key: 'cls', label: 'CLS', value: metrics.cls, unit: '' },
              { key: 'fcp', label: 'FCP', value: metrics.fcp, unit: 'ms' },
              { key: 'ttfb', label: 'TTFB', value: metrics.ttfb, unit: 'ms' },
              { key: 'inp', label: 'INP', value: metrics.inp, unit: 'ms' }
            ].map(({ key, label, value, unit }) => (
              <div key={key} className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                <span className="ux-text-gray-400">{label}:</span>
                <span className={value !== undefined ? getMetricColor(key, value) : 'ux-text-gray-500'}>
                  {value !== undefined ? `${Math.round(value)}${unit}` : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="ux-space-y-2">
            {memoryUsage ? (
              <>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Used:</span>
                  <span className="ux-text-gray-300">{memoryUsage.usedJSHeapSize.toFixed(1)} MB</span>
                </div>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Total:</span>
                  <span className="ux-text-gray-300">{memoryUsage.totalJSHeapSize.toFixed(1)} MB</span>
                </div>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Limit:</span>
                  <span className="ux-text-gray-300">{memoryUsage.jsHeapSizeLimit.toFixed(1)} MB</span>
                </div>
                <div className="ux-mt-2">
                  <div className="ux-flex ux-justify-between ux-text-xs ux-text-gray-400 ux-mb-1">
                    <span>Usage</span>
                    <span>{((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="ux-w-full ux-bg-gray-700 ux-rounded-full ux-h-2">
                    <div 
                      className="ux-bg-blue-600 ux-h-2 ux-rounded-full ux-transition-all ux-duration-300"
                      style={{
                        width: `${Math.min(100, (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="ux-text-xs ux-text-gray-500 ux-text-center ux-py-4">
                Memory info not available
              </div>
            )}
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="ux-space-y-2">
            {connectionInfo ? (
              <>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Type:</span>
                  <span className="ux-text-gray-300">{connectionInfo.effectiveType}</span>
                </div>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Downlink:</span>
                  <span className="ux-text-gray-300">{connectionInfo.downlink} Mbps</span>
                </div>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">RTT:</span>
                  <span className="ux-text-gray-300">{connectionInfo.rtt} ms</span>
                </div>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Preload:</span>
                  <span className={shouldPreload ? 'ux-text-green-400' : 'ux-text-red-400'}>
                    {shouldPreload ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </>
            ) : (
              <div className="ux-text-xs ux-text-gray-500 ux-text-center ux-py-4">
                Network info not available
              </div>
            )}
          </div>
        )}

        {/* Bundle Tab */}
        {activeTab === 'bundle' && (
          <div className="ux-space-y-2">
            {bundleSize ? (
              <>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Total Size:</span>
                  <span className="ux-text-gray-300">{bundleSize.totalSize} MB</span>
                </div>
                <div className="ux-flex ux-justify-between ux-items-center ux-text-xs">
                  <span className="ux-text-gray-400">Gzip Size:</span>
                  <span className="ux-text-gray-300">{bundleSize.gzipSize} MB</span>
                </div>
                <div className="ux-mt-2">
                  <span className="ux-text-xs ux-text-gray-400 ux-block ux-mb-1">Chunks:</span>
                  <div className="ux-space-y-1">
                    {bundleSize.chunks.map((chunk, index) => (
                      <div key={index} className="ux-text-xs ux-text-gray-300 ux-bg-gray-800 ux-px-2 ux-py-1 ux-rounded">
                        {chunk}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="ux-text-xs ux-text-gray-500 ux-text-center ux-py-4">
                Bundle info not available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
