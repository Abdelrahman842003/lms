/**
 * Logger Utility
 * 
 * Conditional logging that only works in development mode.
 * Prevents console.log statements from appearing in production.
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * logger.log('message');
 * logger.error('error message', error);
 * logger.warn('warning');
 * logger.info('info');
 * logger.debug('debug info');
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

interface LoggerConfig {
  enabled: boolean;
  prefix: string;
  showTimestamp: boolean;
  logLevels: LogLevel[];
}

const defaultConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  prefix: '[App]',
  showTimestamp: true,
  logLevels: ['log', 'error', 'warn', 'info', 'debug'],
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private formatMessage(level: LogLevel, args: unknown[]): unknown[] {
    const parts: unknown[] = [];
    
    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(this.config.prefix);
    parts.push(`[${level.toUpperCase()}]`);
    
    return [...parts, ...args];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && this.config.logLevels.includes(level);
  }

  /**
   * General log message
   */
  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', args));
    }
  }

  /**
   * Error message - always logged even in production
   */
  error(...args: unknown[]): void {
    // Errors are always logged
    console.error(...this.formatMessage('error', args));
  }

  /**
   * Warning message
   */
  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', args));
    }
  }

  /**
   * Info message
   */
  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', args));
    }
  }

  /**
   * Debug message - most verbose level
   */
  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', args));
    }
  }

  /**
   * Log with custom prefix
   */
  withPrefix(prefix: string): Logger {
    return new Logger({ ...this.config, prefix });
  }

  /**
   * Group related logs together
   */
  group(label: string): void {
    if (this.config.enabled) {
      console.group(label);
    }
  }

  /**
   * End a group
   */
  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  /**
   * Log a table (useful for arrays/objects)
   */
  table(data: unknown): void {
    if (this.config.enabled) {
      console.table(data);
    }
  }

  /**
   * Start a timer
   */
  time(label: string): void {
    if (this.config.enabled) {
      console.time(label);
    }
  }

  /**
   * End a timer
   */
  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(label);
    }
  }

  /**
   * Create a child logger with additional prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}${prefix}`,
    });
  }
}

// Default logger instance
export const logger = new Logger();

// Named loggers for different modules
export const authLogger = new Logger({ prefix: '[Auth]' });
export const apiLogger = new Logger({ prefix: '[API]' });
export const fcmLogger = new Logger({ prefix: '[FCM]' });
export const uiLogger = new Logger({ prefix: '[UI]' });

// Export the class for custom instances
export { Logger };
export type { LoggerConfig, LogLevel };
