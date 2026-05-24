'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RotateCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    
    // Simulate check
    setTimeout(() => {
      if (navigator.onLine) {
        router.refresh();
        // Redirect back to dashboard/home if we came from somewhere
        router.push('/');
      } else {
        setIsRetrying(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1f37] text-white px-6 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4263eb]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#2d3764] to-[#1a1f37] border border-white/10 shadow-2xl animate-pulse-slow">
          <WifiOff className="w-12 h-12 text-[#4263eb]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[#1a1f37]" />
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight font-arabic text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
            أنت غير متصل بالإنترنت
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed font-arabic">
            يبدو أنك تواجه مشكلة في الاتصال بالشبكة حالياً.
            <br />
            تنبيه: يمكنك تصفح البيانات المحفوظة والعمل دون اتصال، وسيتم مزامنة أي تغييرات فور عودة الاتصال.
          </p>
        </div>

        {/* Buttons / Actions */}
        <div className="w-full space-y-4 pt-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-4 px-6 rounded-xl font-bold font-arabic bg-gradient-to-r from-[#4263eb] to-[#3b5bdb] hover:from-[#3b5bdb] hover:to-[#2b4cbe] text-white shadow-[0_4px_20px_rgba(66,99,235,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`} />
            {isRetrying ? 'جاري التحقق من الاتصال...' : 'إعادة المحاولة'}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/')}
              className="py-3.5 px-5 rounded-xl font-medium font-arabic bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </button>
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.history.back();
              }}
              className="py-3.5 px-5 rounded-xl font-medium font-arabic bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              الرجوع للخلف
            </button>
          </div>
        </div>

        {/* Current status info */}
        <div className="text-xs text-gray-500 font-arabic pt-8">
          حالة الاتصال بالمتصفح: {isOnline ? (
            <span className="text-emerald-500 font-semibold">متصل</span>
          ) : (
            <span className="text-red-500 font-semibold">غير متصل</span>
          )}
        </div>
      </div>
    </div>
  );
}
