'use client';

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Icon } from '@/components/ui';

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1f37',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(66, 99, 235, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          fontSize: '2rem',
          color: '#4263eb'
        }}>
          <Icon name="bell" size="2x" />
        </div>

        <h2 style={{ 
          color: 'white', 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          marginBottom: '16px' 
        }}>
          تفعيل الإشعارات
        </h2>

        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '1rem', 
          lineHeight: '1.6',
          marginBottom: '32px' 
        }}>
          لضمان عدم تفويت أي تحديثات مهمة أو امتحانات أو محاضرات، يرجى تفعيل الإشعارات.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={requestPermission}
            style={{
              background: 'linear-gradient(135deg, #4263eb 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(66, 99, 235, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            تفعيل الإشعارات
          </button>

          <button
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 32px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            ليس الآن
          </button>
        </div>
      </div>
    </div>
  );
};
