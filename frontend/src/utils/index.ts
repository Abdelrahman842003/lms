/**
 * Merge class names utility
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}

/**
 * Format a date to a relative time string (e.g., "2 minutes ago")
 */
export function getTimeAgo(date: Date | string | number): string {
    const now = new Date()
    const past = new Date(date)
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (seconds < 60) {
        return 'Just now'
    }

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }

    const days = Math.floor(hours / 24)
    if (days < 7) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }

    const weeks = Math.floor(days / 7)
    if (weeks < 4) {
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    }

    const months = Math.floor(days / 30)
    if (months < 12) {
        return `${months} ${months === 1 ? 'month' : 'months'} ago`
    }

    const years = Math.floor(days / 365)
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

/**
 * Format a date to a localized string
 */
export function formatDate(date: Date | string | number, locale: string = 'ar-EG'): string {
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Format a date to a localized date and time string
 */
export function formatDateTime(date: Date | string | number, locale: string = 'ar-EG'): string {
    return new Date(date).toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Truncate a string to a specified length
 */
export function truncate(str: string, length: number = 100): string {
    if (str.length <= length) return str
    return str.substring(0, length) + '...'
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Generate a random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    return function (...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false
    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim().length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

/**
 * Format a number to a localized currency string
 */
export function formatCurrency(
    amount: number,
    currency: string = 'EGP',
    locale: string = 'ar-EG'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
    }).format(amount)
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number, locale: string = 'ar-EG'): string {
    return new Intl.NumberFormat(locale).format(num)
}
