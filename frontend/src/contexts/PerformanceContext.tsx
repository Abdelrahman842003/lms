/**
 * Performance Provider
 * Global performance monitoring and optimization provider
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePerformanceMonitoring, useNetworkOptimization } from '@/hooks/usePerformance';

interface PerformanceContextType {
  metrics: any;
  isSupported: boolean;
  connectionInfo: any;
  shouldPreload: boolean;
  logPerformance: () => void;
  sendToAnalytics: () => void;
  getPerformanceGrade: () => string;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: ReactNode;
  enableAnalytics?: boolean;
  autoReport?: boolean;
}

export function PerformanceProvider({ 
  children, 
  enableAnalytics = true,
  autoReport = true 
}: PerformanceProviderProps) {
  const performance = usePerformanceMonitoring();
  const network = useNetworkOptimization();

  // Auto-send to analytics when metrics are collected
  useEffect(() => {
    if (autoReport && enableAnalytics && performance.metrics.score > 0) {
      const timer = setTimeout(() => {
        performance.sendToAnalytics();
      }, 5000); // Wait 5 seconds after initial load

      return () => clearTimeout(timer);
    }
  }, [performance.metrics.score, performance.sendToAnalytics, autoReport, enableAnalytics]);

  // Report critical performance issues
  useEffect(() => {
    if (performance.metrics.score < 50 && performance.metrics.score > 0) {
      console.warn('🚨 Critical Performance Issue Detected', {
        score: performance.metrics.score,
        grade: performance.getPerformanceGrade(),
        metrics: performance.metrics
      });
    }
  }, [performance.metrics.score, performance.getPerformanceGrade, performance.metrics]);

  const value: PerformanceContextType = {
    metrics: performance.metrics,
    isSupported: performance.isSupported,
    connectionInfo: network.connectionInfo,
    shouldPreload: network.shouldPreload,
    logPerformance: performance.logPerformance,
    sendToAnalytics: performance.sendToAnalytics,
    getPerformanceGrade: performance.getPerformanceGrade,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

export default PerformanceProvider;