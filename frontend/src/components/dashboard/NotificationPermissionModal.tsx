'use client';

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Icon, Button } from '@/components/ui';

export const NotificationPermissionModal = () => {
  const { enableNotifications } = useAuth();
  const { isLoading } = useSettings();
  const [isVisible, setIsVisible] = useState(false);

  const checkPermission = () => {
    if (isLoading) return; // Wait for settings to load (and firebase to init)
    
    if (!('Notification' in window)) {
      setIsVisible(false);
      return;
    }

    const currentPermission = Notification.permission;

    // If denied, never show
    if (currentPermission === 'denied' || currentPermission === 'granted') {
      setIsVisible(false);
      return;
    }

    // Check cooldown
    const cooldown = localStorage.getItem('notification_prompt_cooldown');
    if (cooldown && Date.now() < parseInt(cooldown)) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  };

  useEffect(() => {
    checkPermission();

    const handleFocus = () => checkPermission();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleDismiss = () => {
    // Set 24-hour cooldown
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('notification_prompt_cooldown', tomorrow.toString());
    setIsVisible(false);
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      
      if (result === 'granted') {
        setIsVisible(false);
        localStorage.removeItem('notification_prompt_cooldown');
        
        // Register token with backend
        enableNotifications();
        
        // Play sound to confirm and unlock audio
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {});

        new Notification('تم تفعيل الإشعارات بنجاح', {
          body: 'ستصلك الآن جميع التنبيهات المهمة',
          icon: '/logo.png',
          dir: 'rtl'
        });
      } else {
        // If user dismissed the browser prompt (result === 'default') or denied it
        // We treat it as a dismissal for now
        handleDismiss();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay notification-permission-overlay">
      <div className="notification-permission-content">
        <div className="notification-permission-icon">
          <Icon name="bell" size="2x" />
        </div>

        <h2 className="notification-permission-title">
          تفعيل الإشعارات
        </h2>

        <p className="notification-permission-text">
          لضمان عدم تفويت أي تحديثات مهمة أو امتحانات أو محاضرات، يرجى تفعيل الإشعارات.
        </p>

        <div className="notification-permission-actions">
          <Button
            onClick={requestPermission}
            variant="primary"
            className="btn-lg"
          >
            تفعيل الإشعارات
          </Button>

          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="btn-lg"
          >
            ليس الآن
          </Button>
        </div>
      </div>
    </div>
  );
};
