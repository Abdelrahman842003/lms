'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { Button, Icon } from '@/components/ui';

export default function QuickLogoutButton() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="mt-8"
      onClick={handleLogout}
      loading={isLoggingOut}
      disabled={isLoggingOut}
    >
      <span className="inline-flex items-center gap-2">
        <Icon name="sign-out-alt" size="sm" />
        <span>تسجيل الخروج</span>
      </span>
    </Button>
  );
}
