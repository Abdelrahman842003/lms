'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { toast } from 'react-hot-toast';
import { getSettings, updateSettings } from '@/services/settingsService';

function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form States
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'نطاق',
    siteDescription: 'منصة تعليمية متكاملة',
    maintenanceMode: false,
    pricePerStudent: '0',
  });

  const [seoSettings, setSeoSettings] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_og_image: '',
    seo_google_verification: '',
    seo_bing_verification: '',
  });


  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        
        if (!data) return;
        
        // Update General Settings
        if (data.siteName) setGeneralSettings(prev => ({ ...prev, siteName: data.siteName }));
        if (data.siteDescription) setGeneralSettings(prev => ({ ...prev, siteDescription: data.siteDescription }));
        if (data.maintenanceMode) setGeneralSettings(prev => ({ ...prev, maintenanceMode: data.maintenanceMode === 'true' }));
        if (data.pricePerStudent) setGeneralSettings(prev => ({ ...prev, pricePerStudent: data.pricePerStudent }));

        // Update SEO Settings
        if (data.seo_title) setSeoSettings(prev => ({ ...prev, seo_title: data.seo_title }));
        if (data.seo_description) setSeoSettings(prev => ({ ...prev, seo_description: data.seo_description }));
        if (data.seo_keywords) setSeoSettings(prev => ({ ...prev, seo_keywords: data.seo_keywords }));
        if (data.seo_og_image) setSeoSettings(prev => ({ ...prev, seo_og_image: data.seo_og_image }));
        if (data.seo_google_verification) setSeoSettings(prev => ({ ...prev, seo_google_verification: data.seo_google_verification }));
        if (data.seo_bing_verification) setSeoSettings(prev => ({ ...prev, seo_bing_verification: data.seo_bing_verification }));

      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('فشل تحميل الإعدادات');
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const settingsToSave = [
      // General
      { key: 'siteName', value: generalSettings.siteName, group: 'general' },
      { key: 'siteDescription', value: generalSettings.siteDescription, group: 'general' },
      { key: 'maintenanceMode', value: String(generalSettings.maintenanceMode), group: 'general' },
      { key: 'pricePerStudent', value: generalSettings.pricePerStudent, group: 'general' },
      // SEO
      { key: 'seo_title', value: seoSettings.seo_title, group: 'seo' },
      { key: 'seo_description', value: seoSettings.seo_description, group: 'seo' },
      { key: 'seo_keywords', value: seoSettings.seo_keywords, group: 'seo' },
      { key: 'seo_og_image', value: seoSettings.seo_og_image, group: 'seo' },
      { key: 'seo_google_verification', value: seoSettings.seo_google_verification, group: 'seo' },
      { key: 'seo_bing_verification', value: seoSettings.seo_bing_verification, group: 'seo' },
    ];

    try {
      await updateSettings(settingsToSave);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: 'fas fa-cog' },
    { id: 'seo', label: 'SEO', icon: 'fas fa-search' },
    { id: 'security', label: 'الأمان', icon: 'fas fa-shield-alt' },
  ];

  if (isFetching) {
    return (
      <DashboardLayout role="admin" user={user || undefined}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fas fa-cogs text-primary"></i>
          إعدادات النظام
        </h1>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-[#1a1f37] p-2 rounded-xl border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex-1 justify-center sm:flex-none ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {/* General Settings */}
          {activeTab === 'general' && (
            <DashboardCard title="الإعدادات العامة" icon="fas fa-sliders-h">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Site Name and Description removed as per user request */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">سعر الطالب للمدرس (شهرياً)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={generalSettings.pricePerStudent}
                        onChange={(e) => setGeneralSettings({...generalSettings, pricePerStudent: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pl-10"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        ج.م
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">يستخدم هذا السعر لحساب الإيرادات المتوقعة من كل طالب</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-white font-bold mb-4">حالة النظام</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${generalSettings.maintenanceMode ? 'bg-warning/20 text-warning' : 'bg-gray-500/20 text-gray-400'}`}>
                          <i className="fas fa-tools"></i>
                        </div>
                        <div>
                          <div className="text-white font-medium">وضع الصيانة</div>
                          <div className="text-gray-400 text-xs">إيقاف الموقع مؤقتاً للصيانة</div>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${generalSettings.maintenanceMode ? 'bg-primary' : 'bg-gray-600'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${generalSettings.maintenanceMode ? 'left-1' : 'right-1'}`}></div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={generalSettings.maintenanceMode}
                        onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                      />
                    </label>

                  </div>
                </div>
              </div>
            </DashboardCard>
          )}


          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <DashboardCard title="إعدادات SEO" icon="fas fa-search">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">عنوان الموقع (Title Tag)</label>
                    <input
                      type="text"
                      value={seoSettings.seo_title}
                      onChange={(e) => setSeoSettings({...seoSettings, seo_title: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="مثال: نطاق | منصة تعليمية متكاملة"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">الكلمات المفتاحية</label>
                    <input
                      type="text"
                      value={seoSettings.seo_keywords}
                      onChange={(e) => setSeoSettings({...seoSettings, seo_keywords: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="تعليم، منصة، طلاب، مدرسين"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">وصف الموقع (Meta Description)</label>
                  <textarea
                    value={seoSettings.seo_description}
                    onChange={(e) => setSeoSettings({...seoSettings, seo_description: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y min-h-[100px]"
                    placeholder="وصف يظهر في نتائج البحث..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">يُفضل أن يكون الوصف بين 150-160 حرفاً</p>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">رابط صورة Open Graph</label>
                  <input
                    type="url"
                    value={seoSettings.seo_og_image}
                    onChange={(e) => setSeoSettings({...seoSettings, seo_og_image: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="https://example.com/og-image.jpg"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 mt-1">الصورة التي تظهر عند مشاركة الموقع على وسائل التواصل</p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-white font-bold mb-4">أكواد التحقق</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">كود تحقق Google</label>
                      <input
                        type="text"
                        value={seoSettings.seo_google_verification}
                        onChange={(e) => setSeoSettings({...seoSettings, seo_google_verification: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                        placeholder="google-site-verification=..."
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">كود تحقق Bing</label>
                      <input
                        type="text"
                        value={seoSettings.seo_bing_verification}
                        onChange={(e) => setSeoSettings({...seoSettings, seo_bing_verification: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                        placeholder="msvalidate.01=..."
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <DashboardCard title="إعدادات الأمان" icon="fas fa-shield-alt">
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-lock text-4xl mb-4 opacity-50"></i>
                <p>إعدادات الأمان قيد التطوير...</p>
              </div>
            </DashboardCard>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary px-8 py-3 flex items-center gap-2 text-lg"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(SettingsPage);
