'use client';

import React, { useState, useEffect } from 'react';

export const NotificationPermissionModal = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isVisible, setIsVisible] = useState(false);

  const checkPermission = () => {
    if (!('Notification' in window)) {
      // If notifications are not supported, we can't enforce them.
      // Alternatively, we could show a message saying the browser is not supported.
      // For now, let's just hide the modal to not block the user.
      setIsVisible(false);
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    setIsVisible(currentPermission !== 'granted');
  };

  useEffect(() => {
    checkPermission();

    // Re-check on window focus (in case user changed settings in another tab/window)
    const handleFocus = () => checkPermission();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setIsVisible(false);
        // Optional: Send a test notification
        new Notification('تم تفعيل الإشعارات بنجاح', {
          body: 'ستصلك الآن جميع التنبيهات المهمة',
          icon: '/logo.png',
          dir: 'rtl'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
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
        backgroundColor: '#1a1f37', // Matches dashboard theme
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
          <i className="fas fa-bell"></i>
        </div>

        <h2 style={{ 
          color: 'white', 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          marginBottom: '16px' 
        }}>
          تفعيل الإشعارات مطلوب
        </h2>

        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '1rem', 
          lineHeight: '1.6',
          marginBottom: '32px' 
        }}>
          لضمان عدم تفويت أي تحديثات مهمة أو امتحانات أو محاضرات، يجب عليك تفعيل الإشعارات للمتابعة.
        </p>

        {permission === 'denied' ? (
          <div style={{
            backgroundColor: 'rgba(255, 91, 91, 0.1)',
            border: '1px solid rgba(255, 91, 91, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'right'
          }}>
            <p style={{ 
              color: '#ff5b5b', 
              fontWeight: '600', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-exclamation-circle"></i>
              الإشعارات محظورة
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
              لقد قمت بحظر الإشعارات سابقاً. يرجى اتباع الخطوات التالية لتفعيلها:
            </p>
            <ol style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '0.9rem', 
              marginRight: '20px',
              marginTop: '8px',
              textAlign: 'right'
            }}>
              <li>اضغط على أيقونة القفل 🔒 بجوار رابط الموقع في الأعلى.</li>
              <li>ابحث عن "الإشعارات" أو "Notifications".</li>
              <li>قم بتغيير الإعداد إلى "سماح" أو "Allow".</li>
              <li>قم بتحديث الصفحة.</li>
            </ol>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              تحديث الصفحة
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
