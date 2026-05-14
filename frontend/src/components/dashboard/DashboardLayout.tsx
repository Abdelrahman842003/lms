'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationPermissionModal } from './NotificationPermissionModal';


interface DashboardLayoutProps {
  role: 'teacher' | 'student' | 'secretary' | 'parent' | 'academy';
  user?: {
    name: string;
    avatar?: string;
  };
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  user,
  title,
  subtitle,
  headerActions,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-container-navbar">
      {/* Navbar */}
      <Navbar
        role={role}
        user={user}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Content */}
      <main className={`dashboard-main-navbar ${role !== 'parent' ? 'pb-32 md:pb-0' : ''}`}>
        {/* Header */}
        {(title || headerActions) && (
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              {title && <h1 className="dashboard-title">{title}</h1>}
              {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
            </div>
            {headerActions && (
              <div className="dashboard-actions">
                {headerActions}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="dashboard-content">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      {role !== 'parent' && <MobileBottomNav role={role} />}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Permission Modal */}
      <NotificationPermissionModal />
    </div>
  );
};
