'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPublicSettings } from '@/services/settingsService';
import { initializeFirebase } from '@/lib/firebase';
import { applySeasonalThemeToBody } from '@/lib/seasonalTheme';

interface SettingsContextType {
  settings: Record<string, string>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPublicSettings();
        setSettings(data);
        applySeasonalThemeToBody(data);
        
        // Initialize Firebase with fetched settings
        if (data) {
          const firebaseConfig = {
            apiKey: data.firebase_api_key || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: data.firebase_auth_domain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: data.firebase_project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: data.firebase_storage_bucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: data.firebase_messaging_sender_id || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: data.firebase_app_id || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            vapidKey: data.firebase_vapid_key || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          };
          
          initializeFirebase(firebaseConfig);
        } else {
          // Fallback: try env vars directly if settings fetch returned no data
          const envConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          };
          initializeFirebase(envConfig);
        }
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
        applySeasonalThemeToBody({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
