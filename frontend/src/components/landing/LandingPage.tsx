'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import LandingLayout from './LandingLayout';

interface LandingContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
  };
  features: Array<{ icon: string; title: string; description: string }>;
  stats: Array<{ label: string; value: string }>;
  testimonials: Array<{ name: string; role: string; quote: string }>;
}

export default function LandingPage() {
  const { settings } = useSettings();
  const [activeView, setActiveView] = useState(0);
  const router = useRouter();

  const landingContent = useMemo(() => {
    if (!settings.landing_page_content) return null;
    try {
      return JSON.parse(settings.landing_page_content) as LandingContent;
    } catch (e) {
      console.error('Failed to parse landing page content', e);
      return null;
    }
  }, [settings.landing_page_content]);

  // Smooth mouse tracking for 3D tilt effect
  const mousePos = useRef({ x: 0, y: 0 });
  const [smoothMousePos, setSmoothMousePos] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let smoothX = 0, smoothY = 0;
    const animate = () => {
      // Increased tracking speed from 0.08 to 0.15 for more "instant" feel
      smoothX += (mousePos.current.x - smoothX) * 0.15;
      smoothY += (mousePos.current.y - smoothY) * 0.15;
      setSmoothMousePos({ x: smoothX, y: smoothY });
      setTime(Date.now() / 1000);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rotating Dashboard View Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView((prev) => (prev + 1) % 3);
        setIsTransitioning(false);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const useInView = (threshold = 0.15) => {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setInView(true); },
        { threshold }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
  };

  const buildWhatsAppUrl = (rawNumber: string): string | null => {
    if (!rawNumber) return null;
    const normalized = rawNumber.replace(/[^0-9]/g, '');
    return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent('السلام عليكم، أريد الاستفسار عن المنصة')}` : null;
  };

  const waUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const heroAnim = useInView(0.1);
  const ctaAnim = useInView(0.2);

  // Dashboard View Data
  const dashboardData = [
    {
      title: 'نظرة عامة على الأداء',
      subtitle: 'مرحباً بك مجدداً، إليك ملخص اليوم.',
      stats: [
        { label: 'إجمالي الطلاب', value: '1,245', trend: '+12.5%', color: '#27c93f' },
        { label: 'المعلمين', value: '84', trend: '+2', color: '#3249A9' },
        { label: 'الحضور اليومي', value: '94%', trend: '-1%', color: '#ffbd2e' },
        { label: 'الإيرادات', value: '42,500', trend: '+8.2%', color: '#ff5f56' },
      ],
      chartTitle: 'نشاط الطلاب الأسبوعي'
    },
    {
      title: 'إدارة الشؤون الأكاديمية',
      subtitle: 'متابعة حية للمقررات والاختبارات.',
      stats: [
        { label: 'اختبارات منجزة', value: '3,842', trend: '+450', color: '#4c6ef5' },
        { label: 'متوسط الدرجات', value: '88%', trend: '+3%', color: '#27c93f' },
        { label: 'فصول نشطة', value: '24', trend: 'ثابت', color: '#ffbd2e' },
        { label: 'شهادات مصدرة', value: '156', trend: '+12', color: '#ff5f56' },
      ],
      chartTitle: 'تقدم المناهج الدراسية'
    },
    {
      title: 'النظام المالي الذكي',
      subtitle: 'تحصيل آلي وتقارير مالية دقيقة.',
      stats: [
        { label: 'رسوم محصلة', value: '185K', trend: '+15%', color: '#27c93f' },
        { label: 'رسوم معلقة', value: '12,400', trend: '-20%', color: '#ff5f56' },
        { label: 'منح دراسية', value: '45', trend: '+5', color: '#3249A9' },
        { label: 'صافي الربح', value: '142K', trend: '+11%', color: '#4c6ef5' },
      ],
      chartTitle: 'تدفقات الرسوم الشهرية'
    }
  ];

  // Default content
  const content: LandingContent = landingContent || {
    hero: {
      badge: ' عزيزي الطالب، إذا كنت غير قادر على دفع الاشتراك الشهري للمنصة او للسنتر ، يرجى التواصل معنا من فضلك',
      title: 'النظام الذي يفهم التعليم',
      subtitle: 'كما تفهمه أنت.',
      description: 'بعيداً عن الأدوات التقليدية، نطاق هو نظام تشغيل متكامل مصمم خصيصاً للمؤسسات التعليمية.',
      cta_primary: 'ابدأ تجربة مجانية',
      cta_secondary: 'الأسعار',
    },
    features: [],
    stats: [],
    testimonials: []
  };

  return (
    <LandingLayout>
      <section className="relative pt-12 pb-0 md:pt-20" style={{ perspective: '1500px' }}>
        <div
          ref={heroAnim.ref}
          className={`max-w-[1200px] mx-auto px-6 text-center transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            heroAnim.inView ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'center 80%',
            transform: heroAnim.inView ? 'translateY(0) scale(1) rotateX(0)' : 'translateY(100px) scale(0.9) rotateX(20deg)'
          }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/10 bg-white/[0.03] text-gray-400 text-[0.85rem]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9] animate-pulse"></span>
            <span>{content.hero.badge}</span>
          </div>

          <h1 className="text-[2.2rem] sm:text-[3.2rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
            {content.hero.title}
            <br />
            <span className="text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">{content.hero.subtitle}</span>
          </h1>

          <p className="text-[0.95rem] md:text-[1.15rem] text-gray-400 max-w-[580px] mx-auto mb-10 leading-relaxed px-4">
            {content.hero.description}
          </p>

          <div className="flex items-center justify-center gap-4 mb-16 md:mb-20 flex-wrap px-4">
            <button
              onClick={() => router.push('/login')}
              className="group flex items-center gap-2 px-7 py-3.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.95rem] shadow-[0_10px_30px_rgba(50,73,169,0.25)] hover:shadow-[0_15px_40px_rgba(50,73,169,0.35)] hover:-translate-y-0.5"
            >
              <span>{content.hero.cta_primary}</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (waUrl) window.open(waUrl, '_blank');
                else router.push('/contact');
              }}
              className="group flex items-center gap-2 px-7 py-3.5 text-gray-300 hover:text-white font-semibold transition-all duration-300 text-[0.95rem] hover:bg-white/5 rounded-full"
            >
              <span>{content.hero.cta_secondary}</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
          </div>

          {/* 3D Dashboard Simulation & Creative Feature Cards */}
          <div className="relative max-w-[1100px] mx-auto mt-16 sm:mt-24 mb-10 w-full h-[450px] sm:h-[600px] md:h-[700px] z-20" style={{ perspective: '3000px' }}>
            <div className={`absolute inset-0 transition-all duration-700 ease-out pointer-events-none ${isTransitioning ? 'opacity-40 scale-[0.92] blur-[2px] -rotate-y-[15deg]' : 'opacity-100 scale-100 blur-0 rotate-y-0'}`} 
                 style={{ 
                   transform: `rotateX(${-smoothMousePos.y * 8}deg) rotateY(${smoothMousePos.x * 12}deg)`, 
                   transformStyle: 'preserve-3d' 
                 }}>
              
              {/* Background Glow */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-[#3249A9] rounded-full blur-[160px] opacity-[0.08]" style={{ transform: 'translateZ(-150px)' }} />

              {/* Main Dashboard Window */}
              <div className="absolute left-1/2 top-1/2 w-[98%] sm:w-[94%] md:w-[90%] aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/10] max-w-[950px] rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] border border-white/10 bg-[#0c0f1a]/95 backdrop-blur-3xl overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.8)]" style={{ transform: 'translate(-50%, -50%) translateZ(0px)' }}>
                {/* Glass Reflection Effect */}
                <div className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-tr from-white/[0.05] via-transparent to-transparent opacity-50" style={{ transform: `translateX(${smoothMousePos.x * 30}px) translateY(${smoothMousePos.y * 30}px)` }}></div>
                
                {/* Browser Header */}
                <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 md:h-14 bg-[#15192b] border-b border-white/5 flex items-center px-4 sm:px-6 gap-2 md:gap-2.5 z-30">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.3)]"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.3)]"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.3)]"></div>
                  <div className="mx-auto text-[9px] sm:text-[11px] text-gray-500 font-bold tracking-[0.2em] hidden sm:block">DASHBOARD.NIFAQ.EDU</div>
                </div>

                {/* Dashboard Layout */}
                <div className="absolute top-8 sm:top-10 md:top-14 left-0 right-0 bottom-0 flex bg-[#0c0f1a] z-10 overflow-hidden font-[Tajawal]" dir="rtl">
                  
                  {/* Sidebar */}
                  <div className="w-[50px] sm:w-[70px] md:w-[24%] h-full bg-[#111524] border-l border-white/5 flex flex-col pt-4 sm:pt-6 md:pt-10 pb-4 shrink-0">
                    <div className="px-2 sm:px-4 md:px-8 mb-8 sm:mb-10 md:mb-14 flex items-center justify-center md:justify-start gap-4">
                       <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-[#3249A9] to-[#4c6ef5] flex items-center justify-center shrink-0 shadow-xl shadow-[#3249A9]/30">
                         <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-6 md:h-6 bg-white rounded-[4px] sm:rounded-[6px]"></div>
                       </div>
                       <span className="font-black text-base md:text-2xl text-white hidden md:block tracking-tight">نطاق</span>
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:gap-3 px-2 sm:px-3 md:px-5 flex-1 overflow-hidden">
                      <div className="px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-2xl bg-[#3249A9]/10 text-[#27c93f] text-xs font-black flex items-center justify-center md:justify-start gap-4 cursor-pointer border border-[#3249A9]/20 shadow-lg shadow-black/20">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span className="hidden md:block">لوحة القيادة</span>
                      </div>
                      {[
                        { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'الطلاب' },
                        { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'الجدول' },
                        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'المالية' },
                      ].map((item, i) => (
                        <div key={i} className="px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center md:justify-start gap-4 cursor-pointer group">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                          <span className="hidden md:block text-[13px] font-bold">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
                    {/* Header */}
                    <div className="h-12 sm:h-14 md:h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 md:px-10 shrink-0 bg-[#0c0f1a]/80 backdrop-blur-md">
                       <div className="flex-1 max-w-[140px] sm:max-w-[200px] md:max-w-sm">
                         <div className="w-full h-8 sm:h-10 md:h-12 bg-[#15192b] border border-white/5 hover:border-[#3249A9]/30 transition-all rounded-lg sm:rounded-2xl flex items-center px-4 sm:px-5 gap-3 sm:gap-4 cursor-text group">
                           <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-gray-500 group-hover:text-[#3249A9] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                           <div className="text-[10px] sm:text-[12px] text-gray-500 font-medium truncate">ابحث عن أي شيء...</div>
                         </div>
                       </div>
                       <div className="flex items-center gap-3 sm:gap-4">
                         <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-white/10 cursor-pointer">
                           <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                         </div>
                         <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-2xl bg-gradient-to-tr from-[#3249A9] to-[#4c6ef5] border border-white/10 shadow-xl shadow-[#3249A9]/20 cursor-pointer hover:scale-105 transition-transform"></div>
                       </div>
                    </div>

                    {/* Scrollable Dashboard Body */}
                    <div className="flex-1 p-4 sm:p-6 md:p-10 overflow-hidden flex flex-col gap-6 sm:gap-8 md:gap-10">
                       <div className="flex items-center justify-between shrink-0 transition-all duration-500">
                         <div key={activeView} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h3 className="text-sm sm:text-base md:text-2xl font-black text-white tracking-tight">{dashboardData[activeView].title}</h3>
                            <p className="text-[9px] sm:text-[11px] md:text-[13px] text-gray-500 mt-1 md:mt-2 font-medium">{dashboardData[activeView].subtitle}</p>
                         </div>
                         <button className="px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-7 md:py-3.5 bg-[#27c93f] hover:bg-[#22af37] text-white text-[9px] sm:text-[11px] md:text-[13px] font-black rounded-lg sm:rounded-2xl transition-all shadow-xl shadow-[#27c93f]/30 flex items-center gap-2 sm:gap-3 hover:scale-105 active:scale-95">
                            <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            <span className="hidden xs:inline uppercase tracking-wider">إضافة جديد</span>
                         </button>
                       </div>

                       {/* Stat Cards Row */}
                       <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-8 shrink-0">
                         {dashboardData[activeView].stats.map((stat, i) => (
                           <div key={`${activeView}-${i}`} className="bg-[#111524] border border-white/5 rounded-xl sm:rounded-3xl p-3 sm:p-5 md:p-6 flex flex-col gap-2 sm:gap-3 hover:border-[#3249A9]/40 transition-all cursor-default group relative overflow-hidden animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                             <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/[0.03] rounded-bl-[4rem] translate-x-6 -translate-y-6 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform"></div>
                             <span className="text-[8px] sm:text-[10px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.15em] truncate">{stat.label}</span>
                             <div className="flex items-end justify-between relative z-10">
                               <span className="text-sm sm:text-xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</span>
                               <span className="text-[8px] sm:text-[11px] md:text-[13px] font-black px-1.5 py-0.5 rounded-md bg-white/5" style={{ color: stat.color }}>{stat.trend}</span>
                             </div>
                             <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full mt-3 sm:mt-5 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 delay-300" style={{ width: i === 0 ? '85%' : i === 1 ? '70%' : i === 2 ? '94%' : '65%', backgroundColor: stat.color }}></div>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Bottom Section: Chart & Recent */}
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 md:gap-10 min-h-0">
                          {/* Visual Chart Placeholder */}
                          <div className="lg:col-span-2 bg-[#111524] border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-7 md:p-10 flex flex-col gap-4 sm:gap-8 overflow-hidden relative">
                             <div className="flex items-center justify-between shrink-0 relative z-10">
                                <span className="text-[10px] sm:text-[13px] md:text-[16px] font-black text-white tracking-tight">{dashboardData[activeView].chartTitle}</span>
                                <div className="flex gap-4 sm:gap-6">
                                  <div className="flex items-center gap-2 sm:gap-2.5"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#3249A9] shadow-[0_0_10px_rgba(50,73,169,0.5)]"></div><span className="text-[8px] sm:text-[11px] text-gray-500 font-bold">مكتمل</span></div>
                                  <div className="flex items-center gap-2 sm:gap-2.5"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.5)]"></div><span className="text-[8px] sm:text-[11px] text-gray-500 font-bold">نشط</span></div>
                                </div>
                             </div>
                             <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 md:gap-6 px-2 sm:px-4 relative z-10">
                                {[
                                  { day: 'س', h: 65 },
                                  { day: 'ح', h: 85 },
                                  { day: 'ن', h: 45 },
                                  { day: 'ث', h: 95 },
                                  { day: 'ر', h: 75 },
                                  { day: 'خ', h: 60 },
                                  { day: 'ج', h: 30 },
                                ].map((item, i) => (
                                  <div key={`${activeView}-${i}`} className="flex-1 flex flex-col items-center gap-2.5 sm:gap-5 group/bar">
                                    <div className="relative w-full flex items-end justify-center h-full">
                                      <div className="w-full sm:w-[80%] bg-[#3249A9]/5 rounded-t-sm sm:rounded-t-xl absolute inset-0 mb-0"></div>
                                      <div className="w-full sm:w-[80%] bg-gradient-to-t from-[#3249A9] to-[#4c6ef5] rounded-t-sm sm:rounded-t-xl transition-all duration-1000 group-hover/bar:scale-y-[1.08] relative z-10 shadow-lg shadow-[#3249A9]/20" style={{ height: `${item.h}%` }}>
                                         <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 bg-white text-[#111524] text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all -translate-y-2 group-hover/bar:translate-y-0 whitespace-nowrap shadow-xl">%{item.h}</div>
                                      </div>
                                    </div>
                                    <span className="text-[7px] sm:text-[10px] md:text-[12px] text-gray-500 font-black">{item.day}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          {/* Recent Updates */}
                          <div className="bg-[#111524] border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-7 md:p-10 flex flex-col gap-4 sm:gap-8 overflow-hidden md:col-span-2 lg:col-span-1">
                             <span className="text-[10px] sm:text-[13px] md:text-[16px] font-black text-white shrink-0 tracking-tight">آخر التحديثات</span>
                             <div className="flex flex-col gap-3 sm:gap-5 overflow-hidden">
                                {[
                                  activeView === 0 ? [
                                    { user: 'أحمد علي', action: 'تم تسجيل دفع رسوم الترم', time: 'منذ 5 د', color: '#27c93f' },
                                    { user: 'سارة محمد', action: 'انضمت لدورة الفيزياء', time: 'منذ 12 د', color: '#3249A9' },
                                    { user: 'خالد عمر', action: 'أكمل اختبار الكيمياء', time: 'منذ ساعة', color: '#ffbd2e' },
                                  ] : activeView === 1 ? [
                                    { user: 'المعلم مروان', action: 'رفع ملزمة المراجعة النهائية', time: 'منذ دقيقتين', color: '#4c6ef5' },
                                    { user: 'نظام الامتحانات', action: 'بدء اختبار الرياضيات الموحد', time: 'منذ 15 د', color: '#ff5f56' },
                                    { user: 'سناء يوسف', action: 'حققت المركز الأول في التقييم', time: 'منذ 40 د', color: '#27c93f' },
                                  ] : [
                                    { user: 'المحاسب المالي', action: 'إصدار تقرير الربحية السنوي', time: 'منذ 8 د', color: '#27c93f' },
                                    { user: 'بوابة فوري', action: 'تأكيد 45 عملية دفع ناجحة', time: 'منذ ساعة', color: '#3249A9' },
                                    { user: 'النظام المالي', action: 'إرسال تذكيرات الرسوم المتأخرة', time: 'منذ 3 ساعات', color: '#ffbd2e' },
                                  ]
                                ].flat().map((update, i) => (
                                  <div key={`${activeView}-${i}`} className="flex items-center gap-3 sm:gap-5 bg-white/[0.03] p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer group animate-in fade-in slide-in-from-left-6 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-[#3249A9]/10 shrink-0 flex items-center justify-center text-[10px] sm:text-sm text-white font-black group-hover:scale-110 transition-transform shadow-inner border border-white/5" style={{ borderRight: `3px sm:border-right-4 solid ${update.color}` }}>
                                      {update.user.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] sm:text-[12px] md:text-[14px] text-white font-black truncate">{update.user}</span>
                                      <span className="text-[8px] sm:text-[10px] md:text-[12px] text-gray-400 font-medium truncate mt-1">{update.action}</span>
                                    </div>
                                    <span className="mr-auto text-[7px] sm:text-[9px] text-gray-600 font-bold whitespace-nowrap">{update.time}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Creative Floating Feature Cards (Side Cards) --- */}
              
              {/* Card 1: AI (Top Left) */}
              <div className="absolute left-[-5%] sm:left-[-2%] md:left-[5%] top-[12%] sm:top-[8%] w-[110px] sm:w-[150px] md:w-[230px] bg-[#1a1f35]/90 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto hover:border-[#3249A9]/40 hover:-translate-y-2 group/card z-50" 
                   style={{ 
                     transform: `translateZ(180px) rotateY(-12deg) translateY(${Math.sin(time * 1.5) * 12}px)`, 
                     transformStyle: 'preserve-3d' 
                   }}>
                <div className="w-7 h-7 sm:w-11 sm:h-11 bg-blue-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 text-blue-400 group-hover/card:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <h4 className="text-white font-black text-[10px] sm:text-xs md:text-base mb-1 sm:mb-1.5">الذكاء الاصطناعي</h4>
                <p className="text-gray-400 text-[7px] sm:text-[9px] md:text-[12px] leading-relaxed font-medium">توليد اختبارات ومحتوى تعليمي ذكي في ثوانٍ.</p>
                <div className="absolute -z-10 inset-0 bg-blue-500/10 blur-2xl rounded-3xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
              </div>

              {/* Card 2: Interactive Classes (Bottom Right) */}
              <div className="absolute right-[-5%] sm:right-[-2%] md:right-[3%] bottom-[15%] sm:bottom-[12%] w-[110px] sm:w-[150px] md:w-[230px] bg-[#1a1f35]/90 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto hover:border-[#27c93f]/40 hover:-translate-y-2 group/card z-50"
                   style={{ 
                     transform: `translateZ(200px) rotateY(12deg) translateY(${Math.cos(time * 1.5) * 12}px)`, 
                     transformStyle: 'preserve-3d' 
                   }}>
                <div className="w-7 h-7 sm:w-11 sm:h-11 bg-green-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 text-green-400 group-hover/card:scale-110 transition-transform shadow-lg shadow-green-500/10">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <h4 className="text-white font-black text-[10px] sm:text-xs md:text-base mb-1 sm:mb-1.5">فصول حية</h4>
                <p className="text-gray-400 text-[7px] sm:text-[9px] md:text-[12px] leading-relaxed font-medium">تجربة بث مباشر تفاعلية تغنيك عن أي برامج أخرى.</p>
                <div className="absolute -z-10 inset-0 bg-green-500/10 blur-2xl rounded-3xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
              </div>

              {/* Card 3: Payments (Top Right) */}
              <div className="absolute right-[2%] md:right-[6%] top-[12%] w-[100px] sm:w-[140px] md:w-[210px] bg-[#1a1f35]/90 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto hover:border-pink-500/40 hover:-translate-y-2 group/card hidden xs:block"
                   style={{ 
                     transform: `translateZ(150px) rotateX(8deg) translateY(${Math.sin(time * 1.8) * 10}px)`, 
                     transformStyle: 'preserve-3d' 
                   }}>
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-pink-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 text-pink-400 group-hover/card:scale-110 transition-transform shadow-lg shadow-pink-500/10">
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <h4 className="text-white font-black text-[9px] sm:text-[10px] md:text-sm mb-1 sm:mb-1.5">مدفوعات ذكية</h4>
                <p className="text-gray-400 text-[6px] sm:text-[8px] md:text-[11px] leading-relaxed font-medium">تحصيل الرسوم آلياً عبر بوابات دفع آمنة.</p>
              </div>

              {/* Card 4: Reports (Bottom Left) */}
              <div className="absolute left-[0%] md:left-[2%] bottom-[20%] sm:bottom-[15%] w-[100px] sm:w-[140px] md:w-[210px] bg-[#1a1f35]/90 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto hover:border-purple-500/40 hover:-translate-y-2 group/card hidden xs:block"
                   style={{ 
                     transform: `translateZ(130px) rotateX(-8deg) translateY(${Math.cos(time * 1.8) * 10}px)`, 
                     transformStyle: 'preserve-3d' 
                   }}>
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 text-purple-400 group-hover/card:scale-110 transition-transform shadow-lg shadow-purple-500/10">
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h4 className="text-white font-black text-[9px] sm:text-[10px] md:text-sm mb-1 sm:mb-1.5">تقارير دقيقة</h4>
                <p className="text-gray-400 text-[6px] sm:text-[8px] md:text-[11px] leading-relaxed font-medium">تحليلات متقدمة للأداء الأكاديمي.</p>
              </div>

              {/* Connecting Lines (Decorative) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 hidden lg:block" style={{ transform: 'translateZ(-50px)' }}>
                 <line x1="15%" y1="25%" x2="35%" y2="35%" stroke="white" strokeWidth="1" strokeDasharray="8 8" />
                 <line x1="85%" y1="30%" x2="65%" y2="40%" stroke="white" strokeWidth="1" strokeDasharray="8 8" />
                 <line x1="20%" y1="75%" x2="40%" y2="65%" stroke="white" strokeWidth="1" strokeDasharray="8 8" />
                 <line x1="80%" y1="80%" x2="60%" y2="70%" stroke="white" strokeWidth="1" strokeDasharray="8 8" />
              </svg>

            </div>
          </div>
        </div>
      </section>


      {/* Stats Section Dynamic */}
      {content.stats.length > 0 && (
        <section className="py-10 md:py-20 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3249A9]/5 to-transparent animate-pulse"></div>
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-12 text-center relative z-10">
            {content.stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-3 group">
                <span className="text-4xl md:text-5xl font-black text-[#3249A9] group-hover:scale-110 transition-transform duration-500 tracking-tighter">{stat.value}</span>
                <span className="text-gray-400 font-bold text-sm md:text-base uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section Dynamic */}
      {content.features.length > 0 && (
        <section className="py-20 md:py-32">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-right">
              {content.features.map((feature, idx) => (
                <div key={idx} className="group bg-[#15192B] p-10 rounded-[2.5rem] border border-white/5 hover:border-[#3249A9]/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3249A9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-[#3249A9]/10 rounded-2xl flex items-center justify-center mb-8 text-[#3249A9] group-hover:bg-[#3249A9] group-hover:text-white transition-all duration-500 shadow-xl">
                    <i className={`text-2xl ${feature.icon.includes('heroicon') ? 'fas fa-rocket' : feature.icon}`}></i>
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-white group-hover:text-[#3249A9] transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-32" style={{ perspective: '1500px' }}>
        <div className="w-[92%] md:w-[80%] max-w-[1100px] mx-auto">
          <div
            ref={ctaAnim.ref}
            className={`relative rounded-[3rem] overflow-hidden border border-white/[0.08] p-12 md:p-24 transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col items-center justify-center text-center bg-[#0c0f1a] ${
              ctaAnim.inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#3249A9]/10 to-transparent"></div>
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-[400px] h-[400px] bg-[#3249A9] rounded-full blur-[200px] opacity-[0.1] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-[2rem] md:text-[3.5rem] font-black leading-[1.2] mb-10 tracking-tight">
                جاهز للارتقاء بمؤسستك <br className="hidden md:block" /> التعليمية للمستوى القادم؟
              </h2>
              <button
                onClick={() => router.push('/login')}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-black rounded-full transition-all duration-300 text-[1.1rem] shadow-[0_20px_50px_rgba(50,73,169,0.3)] hover:shadow-[0_25px_60px_rgba(50,73,169,0.4)] hover:-translate-y-1"
              >
                <span>ابدأ الآن مجاناً</span>
                <svg className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
