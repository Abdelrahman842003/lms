'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPublicSettings } from '@/services/settingsService';
import { initializeFirebase } from '@/lib/firebase';

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
        
        // Initialize Firebase with fetched settings
        if (data) {
          const firebaseConfig = {
            apiKey: data.firebase_api_key,
            authDomain: data.firebase_auth_domain,
            projectId: data.firebase_project_id,
            storageBucket: data.firebase_storage_bucket,
            messagingSenderId: data.firebase_messaging_sender_id,
            appId: data.firebase_app_id,
            // measurementId: data.firebase_measurement_id, // Optional
            vapidKey: data.firebase_vapid_key // If we decide to store it in DB
          };
          
          initializeFirebase(firebaseConfig);
        }
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
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
