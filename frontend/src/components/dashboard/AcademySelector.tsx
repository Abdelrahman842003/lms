'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';

import { LoadingSpinner, Button, Icon } from '@/components/ui';
interface Academy {
  id: string | null;
  name: string;
  logo: string | null;
  is_active: boolean;
  pivot?: {
    is_active: boolean | number;
  };
}

interface AcademySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AcademySelector({ isOpen, onClose }: AcademySelectorProps) {
  const { selectedAcademy, selectAcademy, user } = useAuth();
  const [academies, setAcademies] = useState<Academy[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAcademies();
    }
  }, [isOpen]);

  const fetchAcademies = async () => {
    try {
      setIsLoading(true);
      const { getCurrentUser, getTeacherAcademies } = await import('@/services/authService');
      
      // Fetch both academies list and user profile to get pivot data
      const [response, userProfile] = await Promise.all([
        getTeacherAcademies(),
        getCurrentUser('teacher')
      ]);

      // Handle both response formats: direct data or wrapped in data property
      const data = (response as any).data || response;
      let academiesList: Academy[] = data.academies || [];
      
      
      // Merge pivot data from user profile if available
      let isIndependentActive = false;
      if (userProfile.user) {
         isIndependentActive = !!userProfile.user.is_independent_active;
         
      if (userProfile.user.academies) {
            const userAcademies = userProfile.user.academies;
            academiesList = academiesList.map(academy => {
              // Loose equality check for ID to handle string/number differences
              const userAcademy = userAcademies.find((ua: any) => ua.id == academy.id);
              if (userAcademy) {
                 if (userAcademy.pivot) {
                    return {
                      ...academy,
                      pivot: userAcademy.pivot
                    };
                 }
              }
              return academy;
            });
         }
      }

      // Prepend "Independent" option if active
      if (isIndependentActive) {
        const independentAcademy: Academy = {
          id: 'independent',
          name: 'شخصي (مستقل)',
          logo: null,
          is_active: true
        };
        academiesList.unshift(independentAcademy);
      }
      
      setAcademies(academiesList);
    } catch (error) {
      setAcademies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAcademy = (academy: Academy) => {
    // If academy.id is null, it means "Independent"
    selectAcademy(academy);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="ux-fixed ux-inset-0 ux-z-9998 ux-flex ux-items-center ux-justify-center ux-p-4 ux-bg-black-50 ux-backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="ux-w-full ux-max-w-500px ux-bg-1e1e2d ux-rounded-xl ux-shadow-2xl ux-border ux-border-white-10 ux-animate-scalein"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ux-flex ux-items-center ux-justify-between ux-p-6 ux-border-b ux-border-white-10">
          <h3 className="ux-text-xl ux-font-bold ux-text-white ux-m-0">اختر الأكاديمية</h3>
          <Button
            variant="ghost"
            size="sm"
            className="ux-w-8 ux-h-8 ux-p-0 ux-flex ux-items-center ux-justify-center ux-rounded-lg"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <Icon name="times" size="sm" />
          </Button>
        </div>

        {/* Body */}
        <div className="ux-p-6 ux-overflow-y-auto ux-max-h-60vh">
          {isLoading ? (
            <div className="ux-flex ux-flex-col ux-items-center ux-justify-center ux-py-8">
              <LoadingSpinner size="lg" color="primary" />
              <p className="ux-text-sm ux-text-gray-400">جاري التحميل...</p>
            </div>
          ) : academies.length === 0 ? (
            <div className="ux-text-center ux-py-8">
              <i className="fas fa-building ux-text-5xl ux-text-gray-600 ux-mb-4"></i>
              <p className="ux-text-gray-300 ux-text-lg ux-mb-2">لا توجد أكاديميات متاحة</p>
              <p className="ux-text-sm ux-text-gray-500">أنت تعمل كمدرس مستقل</p>
            </div>
          ) : (
            <div className="ux-space-y-3">
              {academies.map((academy) => {
                // Helper to check if active (handles boolean, string 'true'/'false', 1/0)
                const isActive = (val: any) => {
                  if (val === true || val === 1 || val === '1' || val === 'true') return true;
                  return false;
                };

                let isSuspended = !isActive(academy.is_active);
                
                // Check pivot status if available (for academy-specific suspension)
                if (academy.pivot && academy.pivot.is_active !== undefined) {
                  isSuspended = !isActive(academy.pivot.is_active);
                }
                
                if (academy.id === null || academy.id === 'Independent' || academy.id === 'independent') {
                  // Check user object for is_independent_active (handling boolean or 0/1)
                  if (user && (user as any).is_independent_active !== undefined) {
                    isSuspended = !(user as any).is_independent_active;
                  }
                }
                return (
                  <button
                    key={academy.id || 'independent'}
                    onClick={() => !isSuspended && handleSelectAcademy(academy)}
                    disabled={isSuspended}
                    className={`ux-w-full ux-flex ux-items-center ux-gap-4 ux-p-4 ux-rounded-xl ux-border ux-transition-all ${
                      isSuspended 
                        ? 'ux-border-red-500-50 ux-bg-red-500-5 ux-cursor-not-allowed ux-opacity-75'
                        : selectedAcademy?.id === academy.id
                          ? 'ux-border-primary-600 ux-bg-primary-600-10'
                          : 'ux-border-white-10 ux-hover-border-primary-600-50 ux-hover-bg-white-5'
                    }`}
                  >
                    {/* Logo/Icon */}
                    <div className="ux-flex-shrink-0">
                      {academy.logo ? (
                        <img
                          src={academy.logo}
                          alt={academy.name}
                          className={`ux-w-12 ux-h-12 ux-rounded-full ux-object-cover ux-border-2 ${isSuspended ? 'ux-border-red-500-30' : 'ux-border-white-10'}`}
                        />
                      ) : (
                        <div className={`ux-w-12 ux-h-12 ux-rounded-full ux-flex ux-items-center ux-justify-center ux-ring-2 ${
                          isSuspended 
                            ? 'ux-bg-red-500-10 ux-ring-red-500-20'
                            : 'ux-bg-gradient-to-br ux-from-primary-500 ux-to-primary-600 ux-ring-primary-400-20'
                        }`}>
                          <i
                            className={`fas ${
                              academy.id ? 'fa-building' : 'fa-user-tie'
                            } ${isSuspended ? 'ux-text-red-400' : 'ux-text-white'} ux-text-lg`}
                          ></i>
                        </div>
                      )}
                    </div>

                    {/* Academy Info */}
                    <div className="ux-flex-1 ux-text-right">
                      <div className={`ux-font-semibold ux-text-base ux-mb-1 ${isSuspended ? 'ux-text-red-400' : 'ux-text-white'}`}>
                        {academy.name} {isSuspended && '(معطل)'}
                      </div>


                      {isSuspended && (
                        <div className="ux-text-xs ux-text-red-400-70 ux-flex ux-items-center ux-justify-end ux-gap-1">
                          <i className="fas fa-ban"></i>
                          <span>تم تعليق الحساب</span>
                        </div>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {selectedAcademy?.id === academy.id && !isSuspended && (
                      <div className="ux-flex-shrink-0">
                        <div className="ux-w-6 ux-h-6 ux-rounded-full ux-bg-primary-600 ux-flex ux-items-center ux-justify-center">
                          <i className="fas fa-check ux-text-white ux-text-xs"></i>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ux-flex ux-items-center ux-justify-end ux-gap-3 ux-p-6 ux-border-t ux-border-white-10">
          <button
            onClick={onClose}
            className="ux-px-5 ux-py-2dot5 ux-text-sm ux-font-medium ux-text-gray-300 ux-hover-text-white ux-hover-bg-white-5 ux-rounded-lg ux-transition-colors"
            type="button"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
