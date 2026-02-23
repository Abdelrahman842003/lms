/**
 * Translation Hook for Reports System
 * 
 * A lightweight translation hook for the reports system.
 * This is a bridge solution until next-intl is fully integrated.
 * 
 * Usage:
 * ```tsx
 * const { t } = useTranslation();
 * <h1>{t('reports.title')}</h1>
 * ```
 */

import { useCallback } from 'react';
import arMessages from '@/i18n/messages/ar.json';
import enMessages from '@/i18n/messages/en.json';

// Type definitions for nested key access
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type Messages = typeof arMessages;
export type TranslationKey = NestedKeyOf<Messages>;

const messages: Record<string, Messages> = {
  ar: arMessages,
  en: enMessages,
};

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let value: unknown = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return typeof value === 'string' ? value : undefined;
}

interface UseTranslationOptions {
  locale?: 'ar' | 'en';
}

interface UseTranslationReturn {
  t: (key: TranslationKey, fallback?: string) => string;
  locale: string;
  isRTL: boolean;
}

export function useTranslation(options: UseTranslationOptions = {}): UseTranslationReturn {
  const locale = options.locale || 'ar';
  const isRTL = locale === 'ar';
  const currentMessages = messages[locale] || messages.ar;

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const value = getNestedValue(currentMessages as Record<string, unknown>, key);
      return value || fallback || key;
    },
    [currentMessages]
  );

  return {
    t,
    locale,
    isRTL,
  };
}

/**
 * Direct translation function for use outside React components
 */
export function translate(key: TranslationKey, locale: 'ar' | 'en' = 'ar', fallback?: string): string {
  const currentMessages = messages[locale] || messages.ar;
  const value = getNestedValue(currentMessages as Record<string, unknown>, key);
  return value || fallback || key;
}

export default useTranslation;
