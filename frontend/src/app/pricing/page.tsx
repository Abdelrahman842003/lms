'use client';

import React, { useEffect, useState } from 'react';
import LandingLayout from '@/components/landing/LandingLayout';
import { fetchApi } from '@/services/api/baseApi';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';

interface PricingPackage {
  id: string;
  name_ar: string;
  name_en: string | null;
  max_students: number;
  storage_limit_gb: number;
  price: string;
  discount_percentage: string | null;
  half_yearly_price: string;
  half_yearly_discount_percentage: string | null;
  yearly_price: string;
  yearly_discount_percentage: string | null;
  features: Array<{ feature: string }>;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semi-annual' | 'yearly'>('monthly');
  const router = useRouter();
  const { settings } = useSettings();

  const handleSubscribe = (pkg: PricingPackage) => {
    let originalPrice = 0;
    let discountPercent = 0;
    let cycleLabel = '';

    if (billingCycle === 'monthly') {
      originalPrice = parseFloat(pkg.price);
      discountPercent = parseFloat(pkg.discount_percentage || '0');
      cycleLabel = 'شهري';
    } else if (billingCycle === 'semi-annual') {
      originalPrice = parseFloat(pkg.half_yearly_price);
      discountPercent = parseFloat(pkg.half_yearly_discount_percentage || '0');
      cycleLabel = 'نصف سنوي';
    } else {
      originalPrice = parseFloat(pkg.yearly_price);
      discountPercent = parseFloat(pkg.yearly_discount_percentage || '0');
      cycleLabel = 'سنوي';
    }

    const discountedPrice = originalPrice * (1 - discountPercent / 100);
    const hasDiscount = discountPercent > 0;
    
    const defaultTemplate = `السلام عليكم، أرغب في الاشتراك في المنصة:
- الباقة: {package_name}
- نوع الاشتراك: {billing_cycle}
- السعر: {price}
{discount_info}`;

    const template = settings.pricingWhatsappMessage || settings.pricing_whatsapp_message || defaultTemplate;
    
    const message = template
      .replace('{package_name}', pkg.name_ar)
      .replace('{billing_cycle}', cycleLabel)
      .replace('{price}', originalPrice > 0 ? `${discountedPrice.toLocaleString()} ج.م` : 'مجاني')
      .replace('{discount_info}', hasDiscount ? `- الخصم المطبق: ${discountPercent}%` : '')
      .trim();

    const contactNumber = (settings.whatsappNumber || settings.support_phone || '').trim();
    const normalizedNumber = contactNumber.replace(/[^0-9]/g, '');
    
    if (normalizedNumber) {
      window.open(`https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await fetchApi<PricingPackage[]>('pricing-packages');
        setPackages(data);
      } catch (error) {
        console.error('Failed to load pricing packages', error);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  const maxMonthlyDiscount = Math.max(...packages.map(pkg => parseFloat(pkg.discount_percentage || '0')), 0);
  const maxSemiAnnualDiscount = Math.max(...packages.map(pkg => parseFloat(pkg.half_yearly_discount_percentage || '0')), 0);
  const maxYearlyDiscount = Math.max(...packages.map(pkg => parseFloat(pkg.yearly_discount_percentage || '0')), 0);

  return (
    <LandingLayout>
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6">خطط الأسعار</h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            اختر الباقة المناسبة لاحتياجاتك التعليمية. جميع الباقات تشمل دعم فني متكامل وتحديثات مستمرة.
          </p>

          {/* Billing Toggle - Restored Original Style */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative p-1 bg-[#15192B] border border-white/5 rounded-2xl flex items-center w-fit min-w-[300px] md:min-w-[450px]">
              {/* Sliding background */}
              <div 
                className={`absolute h-[calc(100%-8px)] rounded-xl bg-[#3249A9] shadow-lg shadow-[#3249A9]/20 transition-all duration-300 ease-out ${
                  billingCycle === 'monthly' 
                    ? 'w-[32%] translate-x-[2%] rtl:translate-x-[-2%]' 
                    : billingCycle === 'semi-annual'
                    ? 'w-[32%] translate-x-[104%] rtl:translate-x-[-104%]'
                    : 'w-[32%] translate-x-[206%] rtl:translate-x-[-206%]'
                }`}
              />
              
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`relative flex-1 py-3 px-4 text-xs md:text-sm font-black transition-colors duration-300 z-10 flex flex-col items-center justify-center ${
                  billingCycle === 'monthly' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>1 شهر</span>
              </button>
              
              <button
                onClick={() => setBillingCycle('semi-annual')}
                className={`relative flex-1 py-3 px-4 text-xs md:text-sm font-black transition-colors duration-300 z-10 flex flex-col items-center justify-center ${
                  billingCycle === 'semi-annual' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>6 شهور</span>
              </button>

              <button
                onClick={() => setBillingCycle('yearly')}
                className={`relative flex-1 py-3 px-4 text-xs md:text-sm font-black transition-colors duration-300 z-10 flex flex-col items-center justify-center ${
                  billingCycle === 'yearly' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>12 شهر</span>
              </button>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#3249A9] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => {
              let originalPrice = 0;
              let discountPercent = 0;
              let cycleText = '';

              if (billingCycle === 'monthly') {
                originalPrice = parseFloat(pkg.price);
                discountPercent = parseFloat(pkg.discount_percentage || '0');
                cycleText = 'شهر';
              } else if (billingCycle === 'semi-annual') {
                originalPrice = parseFloat(pkg.half_yearly_price);
                discountPercent = parseFloat(pkg.half_yearly_discount_percentage || '0');
                cycleText = '6 شهور';
              } else {
                originalPrice = parseFloat(pkg.yearly_price);
                discountPercent = parseFloat(pkg.yearly_discount_percentage || '0');
                cycleText = 'سنة';
              }
              
              const discountedPrice = originalPrice * (1 - discountPercent / 100);
              const savingsAmount = originalPrice - discountedPrice;
              const hasPrice = originalPrice > 0;
              const hasDiscount = discountPercent > 0;

              const savingsPeriodText = billingCycle === 'monthly' ? 'شهرياً' : billingCycle === 'semi-annual' ? 'كل 6 شهور' : 'سنوياً';

              return (
                <div
                  key={pkg.id}
                  className={`relative group bg-[#15192B] rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 p-10 flex flex-col ${
                    pkg.is_popular
                      ? 'border-[#3249A9] shadow-[0_20px_50px_rgba(50,73,169,0.15)]'
                      : 'border-white/5 hover:border-[#3249A9]/30'
                  }`}
                >
                  {pkg.is_popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3249A9] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                      الأكثر رواجاً
                    </div>
                  )}

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-white mb-2">{pkg.name_ar}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">
                        {!hasPrice ? 'مجاناً' : `${discountedPrice.toLocaleString()} ج.م`}
                      </span>
                      {hasPrice && (
                        <span className="text-gray-500 text-sm font-bold">
                          / {cycleText}
                        </span>
                      )}
                    </div>
                    {hasPrice && hasDiscount && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm font-medium">
                            {originalPrice.toLocaleString()} ج.م
                          </span>
                          <span className="text-[11px] bg-[#16a34a] text-white px-2 py-0.5 rounded-lg font-black shadow-sm">
                            وفر {discountPercent}%
                          </span>
                        </div>
                        <div className="text-[#16a34a] text-xs font-black flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          أنت توفر {savingsAmount.toLocaleString()} ج.م {savingsPeriodText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                  <div className="flex flex-col gap-4 mb-10 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300 font-medium">
                        {pkg.max_students === 0 ? 'طلاب غير محدودين' : `حتى ${pkg.max_students} طالب`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300 font-medium">مساحة تخزين {pkg.storage_limit_gb} جيجابايت</span>
                    </div>
                    {pkg.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300 font-medium">{f.feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubscribe(pkg)}
                    className={`w-full py-4 rounded-2xl font-black transition-all duration-300 ${
                      pkg.is_popular
                        ? 'bg-[#3249A9] hover:bg-[#283d8f] text-white shadow-[0_10px_30px_rgba(50,73,169,0.3)]'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    {!hasPrice ? 'ابدأ مجاناً' : 'اشترك الآن'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-24 bg-[#0B0F1A] rounded-[3rem] p-10 md:p-16 border border-white/5 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">هل تحتاج إلى باقة مخصصة؟</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            إذا كانت لديك احتياجات خاصة لمؤسستك تعليمية الكبيرة، يسعدنا تقديم عرض سعر مخصص يتناسب مع متطلباتك.
          </p>
          <button
            onClick={() => {
              const contactNumber = (settings.whatsappNumber || settings.support_phone || '').trim();
              const normalizedNumber = contactNumber.replace(/[^0-9]/g, '');
              if (normalizedNumber) {
                const template = settings.generalWhatsappMessage || settings.general_whatsapp_message || 'السلام عليكم، أرغب في الاستفسار عن باقة مخصصة للمنصة.';
                window.open(`https://wa.me/${normalizedNumber}?text=${encodeURIComponent(template)}`, '_blank');
              } else {
                router.push('/contact');
              }
            }}
            className="px-10 py-4 border border-white/10 hover:border-[#3249A9] rounded-full text-white font-black transition-all"
          >
            تواصل معنا
          </button>
        </div>
      </div>
    </LandingLayout>
  );
}
