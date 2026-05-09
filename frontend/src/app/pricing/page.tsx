'use client';

import React, { useEffect, useState } from 'react';
import LandingLayout from '@/components/landing/LandingLayout';
import { fetchApi } from '@/services/api/baseApi';
import { useRouter } from 'next/navigation';

interface PricingPackage {
  id: string;
  name_ar: string;
  name_en: string | null;
  max_students: number;
  storage_limit_gb: number;
  price: string;
  discount_percentage: string | null;
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();

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

  return (
    <LandingLayout>
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6">خطط الأسعار</h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            اختر الباقة المناسبة لاحتياجاتك التعليمية. جميع الباقات تشمل دعم فني متكامل وتحديثات مستمرة.
          </p>

          {/* Billing Toggle - Redesigned Segmented Control */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative p-1 bg-[#15192B] border border-white/5 rounded-2xl flex items-center w-fit min-w-[280px]">
              {/* Sliding background */}
              <div 
                className={`absolute h-[calc(100%-8px)] rounded-xl bg-[#3249A9] shadow-lg shadow-[#3249A9]/20 transition-all duration-300 ease-out ${
                  billingCycle === 'monthly' ? 'w-[48%] translate-x-[2%]' : 'w-[48%] translate-x-[102%] rtl:translate-x-[-102%]'
                }`}
              />
              
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`relative flex-1 py-3 px-8 text-sm font-black transition-colors duration-300 z-10 ${
                  billingCycle === 'monthly' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                الدفع الشهري
              </button>
              
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`relative flex-1 py-3 px-8 text-sm font-black transition-colors duration-300 z-10 flex items-center justify-center gap-2 ${
                  billingCycle === 'yearly' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                الدفع السنوي
              </button>
            </div>
            
            <div className="flex items-center gap-2 animate-bounce">
              <span className="text-[10px] bg-[#27c93f]/10 text-[#27c93f] px-3 py-1 rounded-full font-black border border-[#27c93f]/20 shadow-sm">
                وفر حتى 30% عند الاشتراك السنوي ⚡
              </span>
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
              const originalPrice = billingCycle === 'monthly' ? parseFloat(pkg.price) : parseFloat(pkg.yearly_price);
              const discountPercent = billingCycle === 'monthly' ? parseFloat(pkg.discount_percentage || '0') : parseFloat(pkg.yearly_discount_percentage || '0');
              
              const discountedPrice = originalPrice * (1 - discountPercent / 100);
              const hasPrice = originalPrice > 0;
              const hasDiscount = discountPercent > 0;

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
                          / {billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}
                        </span>
                      )}
                    </div>
                    {hasPrice && hasDiscount && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through text-sm font-medium">
                          {originalPrice.toLocaleString()} ج.م
                        </span>
                        <span className="text-[10px] bg-[#27c93f]/10 text-[#27c93f] px-1.5 py-0.5 rounded font-black">
                          خصم {discountPercent}%
                        </span>
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
                    onClick={() => router.push('/login')}
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
            onClick={() => router.push('/contact')}
            className="px-10 py-4 border border-white/10 hover:border-[#3249A9] rounded-full text-white font-black transition-all"
          >
            تواصل معنا
          </button>
        </div>
      </div>
    </LandingLayout>
  );
}
