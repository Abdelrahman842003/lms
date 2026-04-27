'use client';

import React from 'react';
import LandingNavbar from './LandingNavbar';

export default function Features() {
  return (
    <div className="relative overflow-x-hidden text-white font-[Tajawal] selection:bg-[#3249A9] selection:text-white pb-20">
      
      <section className="relative pt-32 pb-20 md:pt-40" style={{ perspective: '1500px' }}>
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/10 bg-white/[0.03] text-gray-400 text-[0.85rem]">
            <span>مميزات المنصة</span>
          </div>
          
          <h1 className="text-[2.5rem] md:text-[4rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
            كل ما تحتاجه لإدارة
            <br />
            <span className="text-[#3249A9]">مؤسستك التعليمية.</span>
          </h1>
          
          <p className="text-[1.05rem] md:text-[1.15rem] text-gray-400 max-w-[680px] mx-auto mb-16 leading-relaxed">
            مجموعة متكاملة من الأدوات التي توفر لك تجربة تعليمية وإدارية استثنائية، مصممة خصيصاً لتلبية احتياجاتك.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
            {/* Feature 1 */}
            <div className="bg-[#15192B] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">الذكاء الاصطناعي</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                توليد المحتوى والأسئلة والاختبارات تلقائياً باستخدام أحدث نماذج الذكاء الاصطناعي للارتقاء بتجربة التعلم.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-[#15192B] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">فصول افتراضية حية</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                تواصل مباشر مع طلابك بجودة عالية مع سبورة ذكية وأدوات تفاعلية متقدمة تغنيك عن أي تطبيقات أخرى.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#15192B] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 text-2xl">
                🎮
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">التعلم باللعب (Gamification)</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                حفّز طلابك عبر التحديات والشارات ولوحات الصدارة لزيادة التفاعل والمنافسة وتحقيق نتائج أفضل.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#15192B] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 text-orange-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">تقارير وتحليلات شاملة</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                تابع أداء الطلاب، الحضور، الإنجاز المالي والتعليمي عبر لوحات تحكم مبسطة ودقيقة مع رسوم بيانية وتفاصيل.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#15192B] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">أمان وخصوصية عالية</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                نحمي محتواك من التحميل ونوفر تقنيات التشفير لضمان أن تظل بيانات طلابك ومحتواك في بيئة آمنة تماماً.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#15192B] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 text-pink-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">بوابات دفع مدمجة</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                استقبل مدفوعاتك بكل سهولة مع دعم لجميع طرق الدفع المحلية والعالمية، تحويل آلي، وفواتير إلكترونية متكاملة.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
