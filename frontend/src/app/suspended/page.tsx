"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { Icon, Button } from '@/components/ui';

export default function SuspendedPage() {
  const { logout, user } = useCoreAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96  rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="max-w-md w-full relative">
        <div className="premium-glass premium-border rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl shadow-rose-500/5">
          {/* Icon Header */}
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 relative z-10 animate-bounce-slow">
              <Icon name="exclamation-triangle" className="text-rose-500 text-4xl" />
            </div>
            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-110 opacity-50"></div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {user?.userType === 'student' ? 'تنبيه الاشتراك' : 'حسابك معلق حالياً'}
            </h1>
            <p className="text-gray-light/60 font-bold leading-relaxed">
              {user?.userType === 'student' 
                ? 'عذراً، ليس لديك اشتراك نشط حالياً أو تم تعليق وصولك. يرجى مراجعة المعلم الخاص بك لتفعيل الاشتراك.'
                : user?.userType === 'parent'
                  ? 'عذراً، تم تعليق الوصول حالياً نظراً لعدم وجود اشتراكات نشطة لأي من أبنائكم أو تعليق حساباتهم.'
                  : user?.userType === 'academy'
                    ? 'عذراً، تم تعليق وصول الأكاديمية للنظام حالياً. يرجى مراجعة حالة الاشتراك أو التواصل مع الإدارة.'
                    : 'عذراً، لا يمكنك الوصول إلى لوحة التحكم حالياً حيث لا يوجد نشاط مستقل مفعل لحسابك، كما أنك غير مرتبط بأكاديمية نشطة في الوقت الحالي.'
              }
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-medium text-gray-light/40 italic">
            {user?.userType === 'student' || user?.userType === 'parent'
              ? '"تأكد من دفع الرسوم الدراسية المقررة لتجنب انقطاع الخدمة عن الأبناء."'
              : user?.userType === 'academy'
                ? '"يرجى مراجعة الفواتير المستحقة أو التواصل مع الدعم الفني."'
                : '"يرجى التواصل مع الإدارة لتفعيل نشاطك كمستقل أو الانضمام لإحدى الأكاديميات."'
            }
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button 
              variant="secondary"
              className="w-full h-14 rounded-2xl"
              onClick={() => logout()}
            >
              تسجيل الخروج
            </Button>
            <Button 
              variant="ghost"
              className="w-full text-gray-light/40"
              onClick={() => window.location.href = '/contact'}
            >
              تواصل مع الدعم الفني
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="mt-8 text-center">
            <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.2em]">Platform Status: Restricted</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
