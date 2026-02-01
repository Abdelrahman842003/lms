/**
 * UI and UX Enhancement Hooks
 * 
 * Custom hooks for improving user interface and experience,
 * including animations, interactions, and visual feedback.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Modal and Dialog management hook
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const openModal = useCallback((modalData?: any) => {
    setData(modalData || null);
    setIsOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);
  
  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    data,
    openModal,
    closeModal,
    toggleModal,
  };
}

// Loading states hook with timeout
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const startLoading = useCallback((timeout?: number) => {
    setIsLoading(true);
    
    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, timeout);
    }
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    isLoading,
    startLoading,
    stopLoading,
  };
}

// Toast notifications hook
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration);
  }, [addToast]);
  
  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration);
  }, [addToast]);
  
  const warning = useCallback((message: string, duration?: number) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);
  
  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'info', duration);
  }, [addToast]);
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}

// Intersection Observer hook for lazy loading and animations
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [ref, setRef] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });
    
    observer.observe(ref);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return {
    ref: setRef,
    isIntersecting,
    hasIntersected,
  };
}

// Click outside hook
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void
) {
  const ref = useRef<T>(null);
  
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);
  
  return ref;
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifiers = [];
      
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('alt');
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('cmd');
      
      const shortcut = modifiers.length > 0 
        ? `${modifiers.join('+')}+${key}`
        : key;
      
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Copy to clipboard hook
export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);
  
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      
      setTimeout(() => {
        setHasCopied(false);
      }, timeout);
      
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [timeout]);
  
  return {
    copy,
    hasCopied,
  };
}

// Media query hook
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);
  
  return matches;
}

// Responsive design hooks
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isLargeScreen = useMediaQuery('(min-width: 1440px)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

// Window size hook
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
}

// Local storage state with SSR support
export function useSSRLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try {
        setValue(JSON.parse(stored));
      } catch {
        setValue(fallback);
      }
    }
  }, [key, fallback]);
  
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);
  
  return [value, updateValue] as const;
}

export default {
  useModal,
  useLoadingState,
  useToast,
  useIntersectionObserver,
  useClickOutside,
  useKeyboardShortcuts,
  useClipboard,
  useMediaQuery,
  useResponsive,
  useWindowSize,
  useSSRLocalStorage,
};