'use client';

import React, { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface LandingContent {
  features: Array<{ icon: string; title: string; description: string }>;
}

export default function Features() {
  const { settings } = useSettings();

  const content = useMemo(() => {
    if (!settings.landing_page_content) return null;
    try {
      return JSON.parse(settings.landing_page_content) as LandingContent;
    } catch (e) {
      return null;
    }
  }, [settings.landing_page_content]);

  const features = content?.features || [
    {
      icon: 'fas fa-rocket',
      title: 'الذكاء الاصطناعي',
      description: 'توليد المحتوى والأسئلة والاختبارات تلقائياً باستخدام أحدث نماذج الذكاء الاصطناعي للارتقاء بتجربة التعلم.'
    },
    // ... add other default features if needed for placeholder
  ];

  return (
    <div className="relative overflow-x-hidden text-text-theme-primary font-[Tajawal] selection:bg-[#3249A9] selection:text-white pb-20">
      
      <section className="relative pt-32 pb-20 md:pt-40" style={{ perspective: '1500px' }}>
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-border-theme-primary bg-surface-secondary text-text-theme-secondary text-[0.85rem]">
            <span>مميزات المنصة</span>
          </div>
          
          <h1 className="text-[2.5rem] md:text-[4rem] font-extrabold leading-[1.15] mb-6 tracking-tight text-text-theme-primary">
            كل ما تحتاجه لإدارة
            <br />
            <span className="text-[#3249A9]">مؤسستك التعليمية.</span>
          </h1>
          
          <p className="text-[1.05rem] md:text-[1.15rem] text-text-theme-secondary max-w-[680px] mx-auto mb-16 leading-relaxed">
            مجموعة متكاملة من الأدوات التي توفر لك تجربة تعليمية وإدارية استثنائية، مصممة خصيصاً لتلبية احتياجاتك.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-surface-secondary p-8 rounded-3xl border border-border-theme-secondary hover:border-border-theme-primary transition-all duration-300">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 text-2xl">
                  {feature.icon.includes('heroicon') ? '🚀' : <i className={feature.icon}></i>}
                </div>
                <h3 className="text-xl font-bold mb-3 text-text-theme-primary">{feature.title}</h3>
                <p className="text-text-theme-secondary leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
