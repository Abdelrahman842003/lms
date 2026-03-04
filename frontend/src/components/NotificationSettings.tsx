"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';

const NotificationSettings = () => {
  const { enableNotifications } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnable = async () => {
    if (permission === 'granted') return;

    await enableNotifications();
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  if (!('Notification' in window)) {
    return <div className="ux-text-sm ux-text-gray-500">هذا المتصفح لا يدعم الإشعارات.</div>;
  }

  return (
    <div className="ux-p-4 ux-bg-white ux-rounded-lg ux-shadow-sm ux-border ux-border-gray-100">
      <h3 className="ux-text-lg ux-font-semibold ux-mb-2">إعدادات الإشعارات</h3>
      <div className="ux-flex ux-items-center ux-justify-between">
        <div>
          <p className="ux-text-sm ux-text-gray-600">
            {permission === 'granted' 
              ? 'الإشعارات مفعلة. ستتلقى تنبيهات عند وجود تحديثات جديدة.'
              : permission === 'denied'
                ? 'تم حظر الإشعارات. يرجى تفعيلها من إعدادات المتصفح.'
                : 'قم بتفعيل الإشعارات لتصلك آخر التحديثات.'}
          </p>
        </div>
        
        {permission === 'default' && (
          <button
            onClick={handleEnable}
            className="ux-px-4 ux-py-2 ux-bg-blue-600 ux-text-white ux-rounded-md ux-hover-bg-blue-700 ux-transition-colors ux-text-sm"
          >
            تفعيل الإشعارات
          </button>
        )}
        
        {permission === 'granted' && (
          <span className="ux-text-green-600 ux-font-medium ux-text-sm ux-bg-green-50 ux-px-3 ux-py-1 ux-rounded-full">
            مفعلة
          </span>
        )}

        {permission === 'denied' && (
          <span className="ux-text-red-600 ux-font-medium ux-text-sm ux-bg-red-50 ux-px-3 ux-py-1 ux-rounded-full">
            محظورة
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
