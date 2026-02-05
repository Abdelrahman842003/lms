/**
 * Enhanced Authentication Context
 * 
 * This is the new enhanced AuthContext that combines CoreAuthContext
 * and SelectionContext while maintaining backward compatibility.
 */

"use client";

import React, { ReactNode } from "react";
import { CoreAuthProvider, useCoreAuth } from './CoreAuthContext';
import { SelectionProvider, useSelection } from './SelectionContext';

// Enhanced Auth Hook that combines both contexts
export function useAuth() {
  const coreAuth = useCoreAuth();
  const selection = useSelection();

  return {
    // Core auth properties
    ...coreAuth,
    
    // Selection properties
    selectedTeacher: selection.selectedTeacher,
    selectedChild: selection.selectedChild,
    selectedAcademy: selection.selectedAcademy,
    children: selection.children,
    
    // Selection actions
    selectTeacher: selection.selectTeacher,
    selectChild: selection.selectChild,
    selectAcademy: selection.selectAcademy,
    
    // Enhanced actions
    clearSelections: selection.clearSelections,
    
    // Convenience methods
    enableNotifications: async () => {
      try {
        const { getFcmToken } = await import("@/lib/firebase");
        const token = await getFcmToken();
        
        if (token) {
          // Store FCM token or send to backend
          // You can add API call here to store token in backend
          return token;
        }
        
        return null;
      } catch (error) {
        return null;
      }
    },
  };
}

// Enhanced Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <CoreAuthProvider>
      <SelectionProvider>
        {children}
      </SelectionProvider>
    </CoreAuthProvider>
  );
}

// Backward compatibility exports
export { useCoreAuth } from './CoreAuthContext';
export { useSelection } from './SelectionContext';

export default {
  AuthProvider,
  useAuth,
  useCoreAuth,
  useSelection,
};