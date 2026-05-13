'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { LoadingSpinner, Button, Icon } from '@/components/ui';
import { cn } from '@/utils';

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
    if (isOpen) fetchAcademies();
  }, [isOpen]);

  const fetchAcademies = async () => {
    try {
      setIsLoading(true);
      const { getCurrentUser, getTeacherAcademies } = await import('@/services/authService');
      const [response, userProfile] = await Promise.all([getTeacherAcademies(), getCurrentUser('teacher')]);
      const data = (response as any).data || response;
      let academiesList: Academy[] = data.academies || [];
      
      let isIndependentActive = false;
      if (userProfile.user) {
        isIndependentActive = !!userProfile.user.is_independent_active;
        if (userProfile.user.academies) {
          const userAcademies = userProfile.user.academies;
          academiesList = academiesList.map(academy => {
            const userAcademy = userAcademies.find((ua: any) => ua.id == academy.id);
            if (userAcademy && userAcademy.pivot) return { ...academy, pivot: userAcademy.pivot };
            return academy;
          });
        }
      }

      if (isIndependentActive) {
        const hasIndependent = academiesList.some(a => a.id === null || String(a.id).toLowerCase() === 'independent');
        if (!hasIndependent) {
          academiesList.unshift({ id: 'independent', name: 'شخصي (مستقل)', logo: null, is_active: true });
        }
      }
      setAcademies(academiesList);
    } catch { setAcademies([]); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg premium-glass premium-border rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                <Icon name="university" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter">اختر الأكاديمية</h3>
                <p className="text-[10px] font-bold text-gray-light/20 uppercase tracking-widest">اختر مساحة العمل التي ترغب في دخولها</p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-light/20 hover:text-white transition-all">
             <Icon name="times" />
           </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-none space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <LoadingSpinner size="md" color="primary" />
              <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">جاري جلب المساحات...</span>
            </div>
          ) : academies.length === 0 ? (
            <div className="text-center py-12 opacity-30">
               <Icon name="building" className="text-4xl mb-4" />
               <p className="text-sm font-black uppercase tracking-widest">لا توجد أكاديميات متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {academies.map((academy, index) => {
                const isActive = (val: any) => val === true || val === 1 || val === '1' || val === 'true';
                let isSuspended = !isActive(academy.is_active);
                if (academy.pivot?.is_active !== undefined) isSuspended = !isActive(academy.pivot.is_active);
                if (academy.id === 'independent' && user && (user as any).is_independent_active !== undefined) {
                  isSuspended = !(user as any).is_independent_active;
                }

                const isSelected = selectedAcademy?.id === academy.id;

                return (
                  <button
                    key={`${academy.id}-${index}`}
                    onClick={() => !isSuspended && (selectAcademy(academy), onClose())}
                    disabled={isSuspended}
                    className={cn(
                      "group relative flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 overflow-hidden",
                      isSuspended ? "border-danger/20 bg-danger/5 opacity-60 grayscale cursor-not-allowed" : 
                      isSelected ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(66,99,235,0.1)]" :
                      "border-white/5 bg-white/5 hover:border-primary/40 hover:bg-white/10"
                    )}
                  >
                    {/* Backdrop Glow for Selected */}
                    {isSelected && <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />}

                    <div className="relative z-10 w-16 h-16 rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                      {academy.logo ? (
                        <img src={academy.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name={academy.id === 'independent' ? 'user-tie' : 'building'} className={cn(isSelected ? "text-primary" : "text-white/40")} />
                      )}
                    </div>

                    <div className="relative z-10 flex-1 text-right">
                       <h4 className={cn("text-lg font-black tracking-tight mb-1", isSuspended ? "text-danger" : "text-white")}>
                         {academy.name}
                       </h4>
                       <p className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">
                         {isSuspended ? 'تم تعليق الحساب مؤقتاً' : academy.id === 'independent' ? 'نظام التدريس الفردي' : 'أكاديمية شريكة'}
                       </p>
                    </div>

                    {isSelected && !isSuspended && (
                      <div className="relative z-10 w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in-50">
                        <Icon name="check" size="sm" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white/2 flex justify-end">
           <Button onClick={onClose} variant="outline" className="h-11 px-10 rounded-xl border-white/10 text-gray-light hover:text-white font-black uppercase tracking-widest">
              إغلاق
           </Button>
        </div>
      </div>
    </div>
  );
}
