'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';

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
    console.log('AcademySelector isOpen:', isOpen);
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
            console.log('User Profile Academies for Merge:', userProfile.user.academies);
            const userAcademies = userProfile.user.academies;
            academiesList = academiesList.map(academy => {
              // Loose equality check for ID to handle string/number differences
              const userAcademy = userAcademies.find((ua: any) => ua.id == academy.id);
              if (userAcademy) {
                 console.log(`Found matching academy for ${academy.name}:`, userAcademy);
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
      
      console.log('Final Merged Academies List:', academiesList);
      setAcademies(academiesList);
    } catch (error) {
      console.error('Failed to fetch academies:', error);
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
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white m-0">اختر الأكاديمية</h3>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
              <p className="text-sm text-gray-400">جاري التحميل...</p>
            </div>
          ) : academies.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-building text-5xl text-gray-600 mb-4"></i>
              <p className="text-gray-300 text-lg mb-2">لا توجد أكاديميات متاحة</p>
              <p className="text-sm text-gray-500">أنت تعمل كمدرس مستقل</p>
            </div>
          ) : (
            <div className="space-y-3">
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
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isSuspended 
                        ? 'border-red-500/50 bg-red-500/5 cursor-not-allowed opacity-75'
                        : selectedAcademy?.id === academy.id
                          ? 'border-primary-600 bg-primary-600/10'
                          : 'border-white/10 hover:border-primary-600/50 hover:bg-white/5'
                    }`}
                  >
                    {/* Logo/Icon */}
                    <div className="flex-shrink-0">
                      {academy.logo ? (
                        <img
                          src={academy.logo}
                          alt={academy.name}
                          className={`w-12 h-12 rounded-full object-cover ring-2 ${isSuspended ? 'ring-red-500/30' : 'ring-white/10'}`}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ring-2 ${
                          isSuspended 
                            ? 'bg-red-500/10 ring-red-500/20' 
                            : 'bg-gradient-to-br from-primary-500 to-primary-600 ring-primary-400/20'
                        }`}>
                          <i
                            className={`fas ${
                              academy.id ? 'fa-building' : 'fa-user-tie'
                            } ${isSuspended ? 'text-red-400' : 'text-white'} text-lg`}
                          ></i>
                        </div>
                      )}
                    </div>

                    {/* Academy Info */}
                    <div className="flex-1 text-right">
                      <div className={`font-semibold text-base mb-1 ${isSuspended ? 'text-red-400' : 'text-white'}`}>
                        {academy.name} {isSuspended && '(معطل)'}
                      </div>


                      {isSuspended && (
                        <div className="text-xs text-red-400/70 flex items-center justify-end gap-1">
                          <i className="fas fa-ban"></i>
                          <span>تم تعليق الحساب</span>
                        </div>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {selectedAcademy?.id === academy.id && !isSuspended && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            type="button"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
