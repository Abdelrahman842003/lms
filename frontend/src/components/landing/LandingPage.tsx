'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import LandingLayout from './LandingLayout';

interface LandingContent {
  project_name: string;
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
  };
  about: {
    title: string;
    description: string;
    mission: string;
    values: Array<{ value: string }>;
  };
  contact: {
    title: string;
    description: string;
    email: string;
    phone: string;
    address: string;
  };

  testimonials: Array<{ name: string; role: string; quote: string }>;
}

export default function LandingPage() {
  const { settings } = useSettings();

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
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
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
    about: {
      title: 'رؤيتنا في نيتاق',
      description: 'نيتاق ليست مجرد منصة تعليمية، بل هي شريكك الاستراتيجي في رحلة التحول الرقمي.',
      mission: 'نهدف إلى تمكين المبدعين وصناع المحتوى التعليمي من إدارة وتوسيع أعمالهم بكل سهولة.',
      values: [
        { value: 'الابتكار المستمر والتطوير التقني.' },
        { value: 'الجودة الشاملة في تجربة المستخدم.' },
      ]
    },
    contact: {
      title: 'تواصل معنا',
      description: 'نحن هنا للإجابة على جميع استفساراتك.',
      email: 'support@neetaq.com',
      phone: '+201000000000',
      address: 'المملكة العربية السعودية، الرياض'
    },

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
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-border-theme-primary bg-surface-secondary text-text-theme-secondary text-[0.85rem]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9] animate-pulse"></span>
            <span>{content.hero.badge}</span>
          </div>

          <h1 className="text-[2.2rem] sm:text-[3.2rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.15] mb-6 tracking-tight text-text-theme-primary">
            {content.hero.title}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">{content.hero.subtitle}</span>
          </h1>

          <p className="text-[0.95rem] md:text-[1.15rem] text-text-theme-secondary max-w-[580px] mx-auto mb-10 leading-relaxed px-4">
            {content.hero.description}
          </p>

          <div className="flex items-center justify-center gap-4 mb-16 md:mb-20 flex-wrap px-4">
            <button
              onClick={() => {
                const contactNumber = (settings.whatsappNumber || settings.support_phone || '').trim();
                const normalizedNumber = contactNumber.replace(/[^0-9]/g, '');
                if (normalizedNumber) {
                  const template = settings.freeTrialWhatsappMessage || settings.free_trial_whatsapp_message || 'السلام عليكم، أرغب في بدء تجربة مجانية للمنصة لمدة 14 يوم.';
                  window.open(`https://wa.me/${normalizedNumber}?text=${encodeURIComponent(template)}`, '_blank');
                } else {
                  router.push('/login');
                }
              }}
              className="group flex items-center gap-2 px-7 py-3.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.95rem] shadow-[0_10px_30px_rgba(50,73,169,0.25)] hover:shadow-[0_15px_40px_rgba(50,73,169,0.35)] hover:-translate-y-0.5"
            >
              <span>ابدأ تجربة مجانية لمدة 14 يوم</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
            <button
              onClick={() => {
                router.push('/pricing');
              }}
              className="group flex items-center gap-2 px-7 py-3.5 text-text-theme-secondary hover:text-text-theme-primary font-semibold transition-all duration-300 text-[0.95rem] hover:bg-surface-secondary rounded-full"
            >
              <span>{content.hero.cta_secondary}</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
          </div>


        </div>
      </section>





      {/* CTA Section */}
      <section className="py-20 md:py-32" style={{ perspective: '1500px' }}>
        <div className="w-[92%] md:w-[80%] max-w-[1100px] mx-auto">
          <div
            ref={ctaAnim.ref}
            className={`relative rounded-[3rem] overflow-hidden border border-border-theme-primary p-12 md:p-24 transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col items-center justify-center text-center bg-surface-secondary ${
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
                onClick={() => {
                  const contactNumber = (settings.whatsappNumber || settings.support_phone || '').trim();
                  const normalizedNumber = contactNumber.replace(/[^0-9]/g, '');
                  if (normalizedNumber) {
                    const template = settings.freeTrialWhatsappMessage || settings.free_trial_whatsapp_message || 'السلام عليكم، أرغب في بدء تجربة مجانية للمنصة لمدة 14 يوم.';
                    window.open(`https://wa.me/${normalizedNumber}?text=${encodeURIComponent(template)}`, '_blank');
                  } else {
                    router.push('/login');
                  }
                }}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-black rounded-full transition-all duration-300 text-[1.1rem] shadow-[0_20px_50px_rgba(50,73,169,0.3)] hover:shadow-[0_25px_60px_rgba(50,73,169,0.4)] hover:-translate-y-1"
              >
                <span>ابدأ تجربة مجانية لمدة 14 يوم</span>
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
