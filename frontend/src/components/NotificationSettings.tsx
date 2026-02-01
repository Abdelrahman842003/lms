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
    return <div className="text-sm text-gray-500">هذا المتصفح لا يدعم الإشعارات.</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-2">إعدادات الإشعارات</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            تفعيل الإشعارات
          </button>
        )}
        
        {permission === 'granted' && (
          <span className="text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full">
            مفعلة
          </span>
        )}

        {permission === 'denied' && (
          <span className="text-red-600 font-medium text-sm bg-red-50 px-3 py-1 rounded-full">
            محظورة
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
