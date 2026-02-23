/**
 * i18n Module Exports
 * 
 * Centralized exports for internationalization functionality.
 */

export { useTranslation, translate } from '@/hooks/useTranslation';
export type { TranslationKey } from '@/hooks/useTranslation';
export { defaultLocale, locales, localePrefix, isRTL } from './config';
export type { Locale } from './config';

// Re-export messages for direct access if needed
export { default as arMessages } from './messages/ar.json';
export { default as enMessages } from './messages/en.json';
