'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Academy {
  id: string | null;
  name: string;
  logo: string | null;
  is_active: boolean;
}

interface AcademySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AcademySelector({ isOpen, onClose }: AcademySelectorProps) {
  const { selectedAcademy, selectAcademy } = useAuth();
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
      const { getTeacherAcademies } = await import('@/services/authService');
      const response: any = await getTeacherAcademies();
      console.log('Full API response:', response);
      
      // Handle both response formats: direct data or wrapped in data property
      const data = response.data || response;
      console.log('Processed data:', data);
      
      const academiesList = data.academies || [];
      console.log('Academies list:', academiesList);
      
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
              {academies.map((academy) => (
                <button
                  key={academy.id || 'independent'}
                  onClick={() => handleSelectAcademy(academy)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    selectedAcademy?.id === academy.id
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
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ring-2 ring-primary-400/20">
                        <i
                          className={`fas ${
                            academy.id ? 'fa-building' : 'fa-user-tie'
                          } text-white text-lg`}
                        ></i>
                      </div>
                    )}
                  </div>

                  {/* Academy Info */}
                  <div className="flex-1 text-right">
                    <div className="font-semibold text-white text-base mb-1">
                      {academy.name}
                    </div>
                    {!academy.is_active && academy.id && (
                      <div className="text-xs text-yellow-400 flex items-center justify-end gap-1">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>(غير نشط)</span>
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedAcademy?.id === academy.id && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <i className="fas fa-check text-white text-xs"></i>
                      </div>
                    </div>
                  )}
                </button>
              ))}
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
