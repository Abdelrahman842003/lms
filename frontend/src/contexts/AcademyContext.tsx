/**
 * Academy Context Provider
 *
 * Manages the currently selected academy for the application.
 * Provides a decoupled way to manage academy selection and injects
 * the academy context into API requests automatically.
 *
 * This replaces the direct localStorage access pattern with a proper
 * React Context pattern for better maintainability and testability.
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

/**
 * Academy interface
 */
export interface Academy {
  id: string;
  name: string;
  logo?: string | null;
  is_active?: boolean;
}

/**
 * Academy Context State
 */
interface AcademyContextState {
  currentAcademy: Academy | null;
  setCurrentAcademy: (academy: Academy | null) => void;
  isInIndependentMode: boolean;
  clearAcademy: () => void;
  isLoading: boolean;
}

/**
 * Create the Academy Context
 */
const AcademyContext = createContext<AcademyContextState | null>(null);

/**
 * Academy Provider Props
 */
interface AcademyProviderProps {
  children: ReactNode;
  initialAcademy?: Academy | null;
}

/**
 * Academy Provider Component
 *
 * Wraps the application and provides academy state management.
 * Automatically syncs with localStorage for persistence across sessions.
 */
export function AcademyProvider({
  children,
  initialAcademy = null,
}: AcademyProviderProps) {
  const [currentAcademy, setCurrentAcademyState] = useState<Academy | null>(initialAcademy);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load academy from localStorage on mount
   */
  useEffect(() => {
    try {
      const storedAcademy = localStorage.getItem('selectedAcademy');
      if (storedAcademy) {
        const parsed = JSON.parse(storedAcademy) as Academy;
        setCurrentAcademyState(parsed);
      }
    } catch (error) {
      console.error('Failed to load academy from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set current academy and persist to localStorage
   */
  const setCurrentAcademy = useCallback((academy: Academy | null) => {
    setCurrentAcademyState(academy);

    try {
      if (academy) {
        localStorage.setItem('selectedAcademy', JSON.stringify(academy));
      } else {
        localStorage.removeItem('selectedAcademy');
      }
    } catch (error) {
      console.error('Failed to save academy to localStorage:', error);
    }
  }, []);

  /**
   * Clear current academy
   */
  const clearAcademy = useCallback(() => {
    setCurrentAcademy(null);
  }, [setCurrentAcademy]);

  /**
   * Check if user is in independent mode (independent teacher)
   */
  const isInIndependentMode = currentAcademy?.id === 'independent';

  const value: AcademyContextState = {
    currentAcademy,
    setCurrentAcademy,
    isInIndependentMode,
    clearAcademy,
    isLoading,
  };

  return (
    <AcademyContext.Provider value={value}>
      {children}
    </AcademyContext.Provider>
  );
}

/**
 * Hook to use the Academy Context
 *
 * @throws Error if used outside of AcademyProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentAcademy, setCurrentAcademy, isInIndependentMode } = useAcademy();
 *
 *   return (
 *     <div>
 *       {currentAcademy ? (
 *         <p>Current: {currentAcademy.name}</p>
 *       ) : (
 *         <p>No academy selected</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAcademy(): AcademyContextState {
  const context = useContext(AcademyContext);

  if (!context) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }

  return context;
}

/**
 * Hook to get the academy ID for API requests
 * Returns 'independent' if no academy is selected (for teachers)
 *
 * @example
 * ```tsx
 * function ApiComponent() {
 *   const academyId = useAcademyId();
 *
 *   useEffect(() => {
 *     fetch(`/api/v1/teachers?academy_id=${academyId}`);
 *   }, [academyId]);
 * }
 * ```
 */
export function useAcademyId(): string {
  const { currentAcademy } = useAcademy();
  return currentAcademy?.id ?? 'independent';
}

/**
 * HOC to inject academy context into a component
 * Useful for class components or when you want to enforce academy selection
 *
 * @example
 * ```tsx
 * function Dashboard({ academyId }) {
 *   return <div>Academy: {academyId}</div>;
 * }
 *
 * export default withAcademy(Dashboard);
 * ```
 */
export function withAcademy<P extends { academyId: string }>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, 'academyId'>> {
  return function WithAcademyComponent(props) {
    const academyId = useAcademyId();

    return <Component {...(props as P)} academyId={academyId} />;
  };
}

/**
 * Hook to check if user can access a feature
 * based on academy selection and user type
 */
export function useAcademyFeature(feature: 'students' | 'exams' | 'lectures' | 'reports'): {
  canAccess: boolean;
  reason?: string;
} {
  const { currentAcademy, isInIndependentMode } = useAcademy();

  // Independent teachers have full access to their own data
  if (isInIndependentMode) {
    return { canAccess: true };
  }

  // Must have an academy selected
  if (!currentAcademy) {
    return { canAccess: false, reason: 'يجب اختيار أكاديمي أولاً' };
  }

  // Academy must be active
  if (!currentAcademy.is_active) {
    return { canAccess: false, reason: 'الأكاديمي غير نشط' };
  }

  return { canAccess: true };
}

export default AcademyContext;
