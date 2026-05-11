'use client';

import React, { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface LandingContent {
  about: {
    title: string;
    description: string;
    mission: string;
    values: Array<{ value: string }>;
  };
}

export default function AboutUs() {
  const { settings } = useSettings();

  const content = useMemo(() => {
    if (!settings.landing_page_content) return null;
    try {
      return JSON.parse(settings.landing_page_content) as LandingContent;
    } catch (e) {
      return null;
    }
  }, [settings.landing_page_content]);

  const about = content?.about || {
    title: 'رؤيتنا في نيتاق',
    description: 'نيتاق ليست مجرد منصة تعليمية، بل هي شريكك الاستراتيجي في رحلة التحول الرقمي. تأسست المنصة لتلبية احتياجات المؤسسات التعليمية، المعلمين المستقلين، والأكاديميات لمواكبة تطلعات الجيل الجديد بأساليب مبتكرة تعتمد على الذكاء الاصطناعي والتفاعل المباشر.',
    mission: 'نهدف إلى تمكين المبدعين وصناع المحتوى التعليمي من إدارة وتوسيع أعمالهم بكل سهولة من خلال توفير بنية تحتية تقنية موثوقة ومدعومة بأحدث الأدوات التي تساعد على التفاعل بشكل احترافي مع الطلاب وتطوير مستوياتهم.',
    values: [
      { value: 'الابتكار المستمر والتطوير التقني.' },
      { value: 'الجودة الشاملة في تجربة المستخدم.' },
      { value: 'الأمان والحفاظ على الخصوصية والبيانات.' },
      { value: 'الشفافية في التعامل والأسعار.' },
    ]
  };

  return (
    <div className="relative overflow-x-hidden text-white font-[Tajawal] selection:bg-[#3249A9] selection:text-white pb-20">
      
      <section className="relative pt-32 pb-20 md:pt-40" style={{ perspective: '1500px' }}>
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/10 bg-white/[0.03] text-gray-400 text-[0.85rem]">
            <span>من نحن</span>
          </div>
          
          <h1 className="text-[2.5rem] md:text-[4rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
            {about.title}
          </h1>
          
          <p className="text-[1.05rem] md:text-[1.15rem] text-gray-400 max-w-[750px] mx-auto mb-16 leading-relaxed">
            {about.description}
          </p>

          <div className="bg-[#15192B] border border-white/10 rounded-3xl p-8 md:p-12 text-right relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#3249A9] rounded-full blur-[150px] opacity-10 pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">مهمتنا</h3>
                <p className="text-gray-400 leading-relaxed text-[0.95rem]">
                  {about.mission}
                </p>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">قيمنا الجوهرية</h3>
                <ul className="space-y-3 text-gray-400 text-[0.95rem]">
                  {about.values.map((v, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                      {v.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">+500</div>
                  <div className="text-xs text-gray-500">مؤسسة تعليمية</div>
                </div>
                <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">+50k</div>
                  <div className="text-xs text-gray-500">طالب نشط</div>
                </div>
                <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                  <div className="text-xs text-gray-500">استقرار النظام</div>
                </div>
              </div>
              <img src="/logo.png" alt="Neetaq Logo" className="w-[3rem] h-[3rem] object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
