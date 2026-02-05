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

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && this.config.logLevels.includes(level);
  }

  /**
   * General log message
   */
  log(...args: unknown[]): void {
    void args;
    if (this.shouldLog('log')) {
      return;
    }
  }

  /**
   * Error message - always logged even in production
   */
  error(...args: unknown[]): void {
    void args;
    if (this.shouldLog('error')) {
      return;
    }
  }

  /**
   * Warning message
   */
  warn(...args: unknown[]): void {
    void args;
    if (this.shouldLog('warn')) {
      return;
    }
  }

  /**
   * Info message
   */
  info(...args: unknown[]): void {
    void args;
    if (this.shouldLog('info')) {
      return;
    }
  }

  /**
   * Debug message - most verbose level
   */
  debug(...args: unknown[]): void {
    void args;
    if (this.shouldLog('debug')) {
      return;
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
    void label;
    if (this.config.enabled) {
      return;
    }
  }

  /**
   * End a group
   */
  groupEnd(): void {
    if (this.config.enabled) {
      return;
    }
  }

  /**
   * Log a table (useful for arrays/objects)
   */
  table(data: unknown): void {
    void data;
    if (this.config.enabled) {
      return;
    }
  }

  /**
   * Start a timer
   */
  time(label: string): void {
    void label;
    if (this.config.enabled) {
      return;
    }
  }

  /**
   * End a timer
   */
  timeEnd(label: string): void {
    void label;
    if (this.config.enabled) {
      return;
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
