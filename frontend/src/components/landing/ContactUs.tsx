'use client';

import React, { useState, useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface LandingContent {
  contact: {
    title: string;
    description: string;
    email: string;
    phone: string;
    address: string;
  };
}

export default function ContactUs() {
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const content = useMemo(() => {
    if (!settings.landing_page_content) return null;
    try {
      return JSON.parse(settings.landing_page_content) as LandingContent;
    } catch (e) {
      return null;
    }
  }, [settings.landing_page_content]);

  const contact = content?.contact || {
    title: 'نحن هنا لمساعدتك.',
    description: 'تواصل معنا لأي استفسار أو للحصول على عرض سعر مخصص لمنصتك التعليمية، فريقنا متواجد للرد على كافة أسئلتك.',
    email: 'info@neetaq.com',
    phone: '+20 100 000 0000',
    address: 'المملكة العربية السعودية، الرياض'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="relative overflow-x-hidden text-white font-[Tajawal] selection:bg-[#3249A9] selection:text-white pb-20">
      
      <section className="relative pt-32 pb-20 md:pt-40" style={{ perspective: '1500px' }}>
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/10 bg-white/[0.03] text-gray-400 text-[0.85rem]">
              <span>التواصل الدائم</span>
            </div>
            
            <h1 className="text-[2.5rem] md:text-[4rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
              {contact.title}
            </h1>
            
            <p className="text-[1.05rem] md:text-[1.15rem] text-gray-400 max-w-[650px] mx-auto leading-relaxed">
              {contact.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Contact Form */}
            <div className="bg-[#15192B] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[150px] h-[150px] bg-[#3249A9] rounded-full blur-[100px] opacity-10 pointer-events-none" />
              
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px] z-10 relative">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">تم الإرسال بنجاح!</h3>
                  <p className="text-gray-400 text-sm">سيتواصل معك فريقنا في أقرب وقت ممكن.</p>
                  <button onClick={() => setIsSubmitted(false)} className="mt-8 text-[#3249A9] text-sm hover:underline">
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-[0.85rem] font-medium text-gray-300">الاسم الكامل</label>
                    <input required type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3249A9]/50 transition-colors" placeholder="اكتب اسمك الكامل" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-[0.85rem] font-medium text-gray-300">البريد الإلكتروني</label>
                    <input required type="email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3249A9]/50 transition-colors text-right" dir="rtl" placeholder="name@example.com" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-[0.85rem] font-medium text-gray-300">رسالتك</label>
                    <textarea required rows={4} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3249A9]/50 transition-colors resize-none" placeholder="كيف يمكننا مساعدتك؟" />
                  </div>

                  <button 
                    disabled={isSubmitting} 
                    type="submit" 
                    className="mt-2 w-full py-3.5 bg-[#3249A9] hover:bg-[#283d8f] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(50,73,169,0.2)] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <span>إرسال الرسالة</span>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Contact Info */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#15192B] border border-white/5 p-6 rounded-3xl flex items-start gap-4 hover:border-white/20 transition-all text-right">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">البريد الإلكتروني</h4>
                  <p className="text-gray-400 text-sm mb-2">للرد على استفساراتكم بخصوص المنصة والمبيعات.</p>
                  <a href={`mailto:${contact.email}`} className="text-[#3249A9] font-medium text-sm hover:underline" dir="ltr">{contact.email}</a>
                </div>
              </div>

              <div className="bg-[#15192B] border border-white/5 p-6 rounded-3xl flex items-start gap-4 hover:border-white/20 transition-all text-right">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">الدعم الفني والواتساب</h4>
                  <p className="text-gray-400 text-sm mb-2">تحدث مباشرة مع فريق المبيعات عبر الواتساب.</p>
                  <div className="text-[#3249A9] font-medium text-sm" dir="ltr">{contact.phone}</div>
                </div>
              </div>

              <div className="bg-[#15192B] border border-white/5 p-6 rounded-3xl flex items-start gap-4 hover:border-white/20 transition-all text-right">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">المقر الرئيسي</h4>
                  <p className="text-gray-400 text-sm mb-2">ندعوك لزيارتنا في مقر الشركة للتعرف علينا عن قرب.</p>
                  <div className="text-sm text-gray-400">{contact.address}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
