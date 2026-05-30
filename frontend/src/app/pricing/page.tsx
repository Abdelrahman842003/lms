'use client';

import React, { useEffect, useState } from 'react';
import LandingLayout from '@/components/landing/LandingLayout';
import { fetchApi } from '@/services/api/baseApi';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';

interface VideoBundle {
  name_ar: string;
  name_en: string;
  storage_minutes: number;
  delivery_minutes: number;
  price: number;
}

interface PricingPackage {
  id: string;
  name_ar: string;
  name_en: string | null;
  max_students: number;
  storage_minutes: number;
  delivery_minutes: number;
  price: string;
  discount_percentage: string | null;
  half_yearly_price: string;
  half_yearly_discount_percentage: string | null;
  yearly_price: string;
  yearly_discount_percentage: string | null;
  features: Array<{ feature: string }>;
  video_bundles: VideoBundle[] | null;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'plans' | 'addons'>('plans');
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

  const handleAddonOrder = (addon: VideoBundle) => {
    const message = `السلام عليكم، أرغب في طلب باقة فيديوهات إضافية (Add-on):
- الباقة: ${addon.name_ar}
- السعر: ${addon.price.toLocaleString()} ج.م
- التخزين: ${addon.storage_minutes.toLocaleString()} دقيقة
- المشاهدة: ${addon.delivery_minutes.toLocaleString()} دقيقة`;

    const contactNumber = (settings.whatsappNumber || settings.support_phone || '').trim();
    const normalizedNumber = contactNumber.replace(/[^0-9]/g, '');
    
    if (normalizedNumber) {
      window.open(`https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`, '_blank');
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

  const plans = packages.filter(pkg => pkg.type === 'plan' || !pkg.type);
  const addons = packages.filter(pkg => pkg.type === 'addon');

  return (
    <LandingLayout>
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6">خطط الأسعار</h1>
          <p className="text-text-theme-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10">
            اختر الباقة المناسبة لاحتياجاتك التعليمية. جميع الباقات تشمل دعم فني متكامل وتحديثات مستمرة.
          </p>

          <div className="flex flex-col items-center gap-8">
             {/* Main View Toggle (Plans vs Addons) */}
             <div className="p-1 bg-surface-secondary border border-border-theme-secondary rounded-2xl flex items-center w-fit">
               <button
                  onClick={() => setViewType('plans')}
                  className={`px-8 py-3 rounded-xl font-black transition-all duration-300 ${
                    viewType === 'plans' ? 'bg-[#3249A9] text-white shadow-lg shadow-[#3249A9]/20' : 'text-text-theme-muted hover:text-text-theme-primary'
                  }`}
               >
                 خطط الاشتراك
               </button>
               <button
                  onClick={() => setViewType('addons')}
                  className={`px-8 py-3 rounded-xl font-black transition-all duration-300 ${
                    viewType === 'addons' ? 'bg-[#3249A9] text-white shadow-lg shadow-[#3249A9]/20' : 'text-text-theme-muted hover:text-text-theme-primary'
                  }`}
               >
                 باقات الفيديوهات
               </button>
             </div>

            {/* Billing Toggle (Only for Plans) */}
            {viewType === 'plans' && (
              <div className="relative p-1 bg-surface-secondary border border-border-theme-secondary rounded-2xl flex items-center w-fit min-w-[300px] md:min-w-[450px] animate-in fade-in slide-in-from-top-2 duration-500">
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
                    billingCycle === 'monthly' ? 'text-white' : 'text-text-theme-muted hover:text-text-theme-primary'
                  }`}
                >
                  <span>1 شهر</span>
                </button>
                
                <button
                  onClick={() => setBillingCycle('semi-annual')}
                  className={`relative flex-1 py-3 px-4 text-xs md:text-sm font-black transition-colors duration-300 z-10 flex flex-col items-center justify-center ${
                    billingCycle === 'semi-annual' ? 'text-white' : 'text-text-theme-muted hover:text-text-theme-primary'
                  }`}
                >
                  <span>6 شهور</span>
                </button>

                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative flex-1 py-3 px-4 text-xs md:text-sm font-black transition-colors duration-300 z-10 flex flex-col items-center justify-center ${
                    billingCycle === 'yearly' ? 'text-white' : 'text-text-theme-muted hover:text-text-theme-primary'
                  }`}
                >
                  <span>12 شهر</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#3249A9] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="min-h-[500px]">
            {viewType === 'plans' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
                {plans.map((pkg) => {
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
                      className={`relative group bg-surface-secondary rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 p-10 flex flex-col ${
                        pkg.is_popular
                          ? 'border-[#3249A9] shadow-[0_20px_50px_rgba(50,73,169,0.15)]'
                          : 'border-border-theme-secondary hover:border-card-border-hover'
                      }`}
                    >
                      {pkg.is_popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3249A9] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                          الأكثر رواجاً
                        </div>
                      )}

                      <div className="mb-8">
                        <h3 className="text-2xl font-black text-text-theme-primary mb-2">{pkg.name_ar}</h3>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-text-theme-primary">
                              {!hasPrice ? 'مجاناً' : `${discountedPrice.toLocaleString()} ج.م`}
                            </span>
                            {hasPrice && (
                              <span className="text-text-theme-secondary text-sm font-bold">
                                / {cycleText}
                              </span>
                            )}
                          </div>
                          {hasPrice && hasDiscount && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-text-theme-secondary line-through text-sm font-medium">
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
                          <span className="text-text-theme-secondary font-medium">
                            {pkg.max_students === 0 ? 'طلاب غير محدودين' : `حتى ${pkg.max_students} طالب`}
                          </span>
                        </div>
                        {pkg.storage_minutes > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-text-theme-secondary font-medium">تخزين {pkg.storage_minutes.toLocaleString()} دقيقة فيديو</span>
                          </div>
                        )}
                        {pkg.delivery_minutes > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-text-theme-secondary font-medium">مشاهدة {pkg.delivery_minutes.toLocaleString()} دقيقة فيديو</span>
                          </div>
                        )}
                        {pkg.features?.map((f, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-text-theme-secondary font-medium">{f.feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleSubscribe(pkg)}
                        className={`w-full py-4 rounded-2xl font-black transition-all duration-300 ${
                          pkg.is_popular
                            ? 'bg-[#3249A9] hover:bg-[#283d8f] text-white shadow-[0_10px_30px_rgba(50,73,169,0.3)]'
                            : 'bg-surface-tertiary hover:bg-surface-hover text-text-theme-primary'
                        }`}
                      >
                        {!hasPrice ? 'ابدأ مجاناً' : 'اشترك الآن'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {addons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {addons.map((addon, idx) => (
                      <div 
                        key={idx}
                        className="relative group bg-surface-secondary rounded-[2.5rem] border border-border-theme-secondary hover:border-card-border-hover transition-all duration-500 hover:-translate-y-2 p-10 flex flex-col"
                      >
                        <div className="mb-8">
                          <h4 className="text-2xl font-black text-text-theme-primary mb-2">{addon.name_ar}</h4>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-text-theme-primary">{parseFloat(addon.price as any).toLocaleString()} ج.م</span>
                            <span className="text-text-theme-secondary text-sm font-bold">/ شهرياً</span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <span className="text-text-theme-secondary font-medium">{addon.storage_minutes.toLocaleString()} دقيقة تخزين إضافية</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#3249A9]/20 flex items-center justify-center text-[#3249A9]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <span className="text-text-theme-secondary font-medium">{addon.delivery_minutes.toLocaleString()} دقيقة مشاهدة إضافية</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#16a34a]/20 flex items-center justify-center text-[#16a34a]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-text-theme-secondary font-medium">تفعيل فوري</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleAddonOrder(addon as any)}
                          className="w-full py-4 bg-surface-tertiary hover:bg-[#3249A9] text-text-theme-primary hover:text-white rounded-2xl font-black transition-all duration-300"
                        >
                          اطلب الباقة الآن
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-6 text-text-theme-muted border border-border-theme-primary">
                       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                    </div>
                    <h3 className="text-xl font-black text-text-theme-primary mb-2">لا يوجد باقات إضافية حالياً</h3>
                    <p className="text-text-theme-muted">يرجى العودة لاحقاً أو التواصل مع الدعم الفني لمزيد من المعلومات</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-24 bg-surface-secondary rounded-[3rem] p-10 md:p-16 border border-border-theme-secondary text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-text-theme-primary">هل تحتاج إلى باقة مخصصة؟</h2>
          <p className="text-text-theme-secondary text-lg mb-10 max-w-2xl mx-auto">
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
            className="px-10 py-4 border border-border-theme-primary hover:border-[#3249A9] rounded-full text-text-theme-primary font-black hover:bg-surface-hover transition-all"
          >
            تواصل معنا
          </button>
        </div>
      </div>
    </LandingLayout>
  );
}
