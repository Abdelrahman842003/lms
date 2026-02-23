/**
 * Next-intl Configuration for Reports System
 * 
 * This file configures the internationalization setup for the application.
 * Currently supports Arabic (ar) as the primary language.
 * 
 * @see https://next-intl-docs.vercel.app/docs/configuration
 */

export type Locale = 'ar' | 'en';

export const defaultLocale: Locale = 'ar';
export const locales: Locale[] = ['ar', 'en'];

export const localePrefix = 'as-needed';

/**
 * Get messages for a specific locale
 */
export async function getMessages(locale: Locale) {
  return (await import(`./messages/${locale}.json`)).default;
}

/**
 * RTL support configuration
 */
export const rtlLocales: Locale[] = ['ar'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
