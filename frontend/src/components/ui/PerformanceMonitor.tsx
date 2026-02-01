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
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    if (score >= 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const getMetricColor = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        if (value <= 2500) return 'text-green-500';
        if (value <= 4000) return 'text-yellow-500';
        return 'text-red-500';
      case 'fid':
        if (value <= 100) return 'text-green-500';
        if (value <= 300) return 'text-yellow-500';
        return 'text-red-500';
      case 'cls':
        if (value <= 0.1) return 'text-green-500';
        if (value <= 0.25) return 'text-yellow-500';
        return 'text-red-500';
      case 'fcp':
        if (value <= 1800) return 'text-green-500';
        if (value <= 3000) return 'text-yellow-500';
        return 'text-red-500';
      default:
        return 'text-gray-300';
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
        className={`fixed ${positionClasses[position]} z-50 bg-gray-900 border border-gray-700 rounded-lg p-2 cursor-pointer hover:bg-gray-800 transition-colors`}
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-gray-300">Perf</span>
          <span className={getScoreColor(metrics.score)}>{metrics.score}</span>
          <span className="text-gray-400">({getPerformanceGrade()})</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden`}
      dir="ltr"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isSupported ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
          <h3 className="text-sm font-medium text-gray-200">Performance Monitor</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold ${getScoreColor(metrics.score)}`}>
            {metrics.score}
          </span>
          <button
            onClick={() => setMinimized(true)}
            className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'vitals', label: 'Vitals' },
          { key: 'memory', label: 'Memory' },
          { key: 'network', label: 'Network' },
          { key: 'bundle', label: 'Bundle' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {/* Core Web Vitals Tab */}
        {activeTab === 'vitals' && (
          <div className="space-y-2">
            {[
              { key: 'lcp', label: 'LCP', value: metrics.lcp, unit: 'ms' },
              { key: 'fid', label: 'FID', value: metrics.fid, unit: 'ms' },
              { key: 'cls', label: 'CLS', value: metrics.cls, unit: '' },
              { key: 'fcp', label: 'FCP', value: metrics.fcp, unit: 'ms' },
              { key: 'ttfb', label: 'TTFB', value: metrics.ttfb, unit: 'ms' },
              { key: 'inp', label: 'INP', value: metrics.inp, unit: 'ms' }
            ].map(({ key, label, value, unit }) => (
              <div key={key} className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{label}:</span>
                <span className={value !== undefined ? getMetricColor(key, value) : 'text-gray-500'}>
                  {value !== undefined ? `${Math.round(value)}${unit}` : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="space-y-2">
            {memoryUsage ? (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Used:</span>
                  <span className="text-gray-300">{memoryUsage.usedJSHeapSize.toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-gray-300">{memoryUsage.totalJSHeapSize.toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Limit:</span>
                  <span className="text-gray-300">{memoryUsage.jsHeapSizeLimit.toFixed(1)} MB</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Usage</span>
                    <span>{((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                Memory info not available
              </div>
            )}
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="space-y-2">
            {connectionInfo ? (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-gray-300">{connectionInfo.effectiveType}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Downlink:</span>
                  <span className="text-gray-300">{connectionInfo.downlink} Mbps</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">RTT:</span>
                  <span className="text-gray-300">{connectionInfo.rtt} ms</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Preload:</span>
                  <span className={shouldPreload ? 'text-green-400' : 'text-red-400'}>
                    {shouldPreload ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                Network info not available
              </div>
            )}
          </div>
        )}

        {/* Bundle Tab */}
        {activeTab === 'bundle' && (
          <div className="space-y-2">
            {bundleSize ? (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total Size:</span>
                  <span className="text-gray-300">{bundleSize.totalSize} MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Gzip Size:</span>
                  <span className="text-gray-300">{bundleSize.gzipSize} MB</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-400 block mb-1">Chunks:</span>
                  <div className="space-y-1">
                    {bundleSize.chunks.map((chunk, index) => (
                      <div key={index} className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {chunk}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                Bundle info not available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}