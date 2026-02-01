'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
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
    academyPricePerStudent: '0',
    whatsappNumber: '',
  });

  const [seoSettings, setSeoSettings] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_og_image: '',
    seo_google_verification: '',
    seo_bing_verification: '',
  });

  const [apiKeys, setApiKeys] = useState({
    // Firebase
    firebase_service_account: '',
    firebase_api_key: '',
    firebase_auth_domain: '',
    firebase_project_id: '',
    firebase_storage_bucket: '',
    firebase_messaging_sender_id: '',
    firebase_app_id: '',
    
    // Cloudflare R2
    cloudflare_r2_access_key_id: '',
    cloudflare_r2_secret_access_key: '',
    cloudflare_r2_bucket: '',
    cloudflare_r2_endpoint: '',
    cloudflare_r2_public_url: '',
    
    // Cloudflare KV
    cloudflare_kv_account_id: '',
    cloudflare_kv_namespace_id: '',
    cloudflare_kv_api_token: '',
    
    // AI
    openai_api_key: '',
    gemini_api_key: '',
    
    // Cloudflare Turnstile (Security)
    turnstile_site_key: '',
    turnstile_secret_key: '',
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
        if (data.academy_student_price) setGeneralSettings(prev => ({ ...prev, academyPricePerStudent: data.academy_student_price }));
        if (data.whatsappNumber) setGeneralSettings(prev => ({ ...prev, whatsappNumber: data.whatsappNumber }));

        // Update SEO Settings
        if (data.seo_title) setSeoSettings(prev => ({ ...prev, seo_title: data.seo_title }));
        if (data.seo_description) setSeoSettings(prev => ({ ...prev, seo_description: data.seo_description }));
        if (data.seo_keywords) setSeoSettings(prev => ({ ...prev, seo_keywords: data.seo_keywords }));
        if (data.seo_og_image) setSeoSettings(prev => ({ ...prev, seo_og_image: data.seo_og_image }));
        if (data.seo_google_verification) setSeoSettings(prev => ({ ...prev, seo_google_verification: data.seo_google_verification }));
        if (data.seo_bing_verification) setSeoSettings(prev => ({ ...prev, seo_bing_verification: data.seo_bing_verification }));

        // Update API Keys
        setApiKeys(prev => ({
          ...prev,
          ...Object.keys(prev).reduce((acc, key) => {
            if (data[key]) acc[key] = data[key];
            return acc;
          }, {} as any)
        }));

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
      { key: 'academy_student_price', value: generalSettings.academyPricePerStudent, group: 'general' },
      { key: 'whatsappNumber', value: generalSettings.whatsappNumber, group: 'general' },
      // SEO
      { key: 'seo_title', value: seoSettings.seo_title, group: 'seo' },
      { key: 'seo_description', value: seoSettings.seo_description, group: 'seo' },
      { key: 'seo_keywords', value: seoSettings.seo_keywords, group: 'seo' },
      { key: 'seo_og_image', value: seoSettings.seo_og_image, group: 'seo' },
      { key: 'seo_google_verification', value: seoSettings.seo_google_verification, group: 'seo' },
      { key: 'seo_bing_verification', value: seoSettings.seo_bing_verification, group: 'seo' },
      // API Keys
      ...Object.entries(apiKeys).map(([key, value]) => ({
        key,
        value,
        group: 'secrets'
      }))
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
    { id: 'secrets', label: 'مفاتيح API', icon: 'fas fa-key' },
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

                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">سعر الطالب للأكاديمية (شهرياً)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={generalSettings.academyPricePerStudent}
                        onChange={(e) => setGeneralSettings({...generalSettings, academyPricePerStudent: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pl-10"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        ج.م
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">يستخدم هذا السعر لحساب عمولة المنصة من الأكاديميات</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">رقم الواتساب للتواصل</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="201012345678"
                        value={generalSettings.whatsappNumber}
                        onChange={(e) => setGeneralSettings({...generalSettings, whatsappNumber: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fab fa-whatsapp"></i>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">يستخدم هذا الرقم في زر "تواصل مع الإدارة" على الصفحة الرئيسية</p>
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

          {/* API Keys Settings */}
          {activeTab === 'secrets' && (
            <div className="space-y-6">
              {/* Firebase */}
              <DashboardCard title="إعدادات Firebase" icon="fab fa-google">
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Service Account (JSON)</label>
                    <textarea
                      value={apiKeys.firebase_service_account}
                      onChange={(e) => setApiKeys({...apiKeys, firebase_service_account: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-xs h-32"
                      placeholder='{"type": "service_account", ...}'
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">API Key</label>
                      <input
                        type="password"
                        value={apiKeys.firebase_api_key}
                        onChange={(e) => setApiKeys({...apiKeys, firebase_api_key: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Auth Domain</label>
                      <input
                        type="text"
                        value={apiKeys.firebase_auth_domain}
                        onChange={(e) => setApiKeys({...apiKeys, firebase_auth_domain: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Project ID</label>
                      <input
                        type="text"
                        value={apiKeys.firebase_project_id}
                        onChange={(e) => setApiKeys({...apiKeys, firebase_project_id: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Storage Bucket</label>
                      <input
                        type="text"
                        value={apiKeys.firebase_storage_bucket}
                        onChange={(e) => setApiKeys({...apiKeys, firebase_storage_bucket: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Messaging Sender ID</label>
                      <input
                        type="text"
                        value={apiKeys.firebase_messaging_sender_id}
                        onChange={(e) => setApiKeys({...apiKeys, firebase_messaging_sender_id: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">App ID</label>
                      <input
                        type="text"
                        value={apiKeys.firebase_app_id}
                        onChange={(e) => setApiKeys({...apiKeys, firebase_app_id: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Cloudflare R2 */}
              <DashboardCard title="إعدادات Cloudflare R2" icon="fas fa-cloud">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Access Key ID</label>
                      <input
                        type="password"
                        value={apiKeys.cloudflare_r2_access_key_id}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_r2_access_key_id: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Secret Access Key</label>
                      <input
                        type="password"
                        value={apiKeys.cloudflare_r2_secret_access_key}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_r2_secret_access_key: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Bucket Name</label>
                      <input
                        type="text"
                        value={apiKeys.cloudflare_r2_bucket}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_r2_bucket: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Endpoint</label>
                      <input
                        type="text"
                        value={apiKeys.cloudflare_r2_endpoint}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_r2_endpoint: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-300 mb-2 text-sm">Public URL</label>
                      <input
                        type="text"
                        value={apiKeys.cloudflare_r2_public_url}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_r2_public_url: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Cloudflare KV */}
              <DashboardCard title="إعدادات Cloudflare KV" icon="fas fa-database">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Account ID</label>
                      <input
                        type="text"
                        value={apiKeys.cloudflare_kv_account_id}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_kv_account_id: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Namespace ID</label>
                      <input
                        type="text"
                        value={apiKeys.cloudflare_kv_namespace_id}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_kv_namespace_id: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-300 mb-2 text-sm">API Token</label>
                      <input
                        type="password"
                        value={apiKeys.cloudflare_kv_api_token}
                        onChange={(e) => setApiKeys({...apiKeys, cloudflare_kv_api_token: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* AI Keys */}
              <DashboardCard title="إعدادات الذكاء الاصطناعي (AI)" icon="fas fa-robot">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">OpenAI API Key</label>
                      <input
                        type="password"
                        value={apiKeys.openai_api_key}
                        onChange={(e) => setApiKeys({...apiKeys, openai_api_key: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Gemini API Key</label>
                      <input
                        type="password"
                        value={apiKeys.gemini_api_key}
                        onChange={(e) => setApiKeys({...apiKeys, gemini_api_key: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Cloudflare Turnstile */}
              <DashboardCard title="Cloudflare Turnstile (حماية من البوتات)" icon="fas fa-shield-alt">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                      <div className="text-sm text-blue-300">
                        <p className="font-medium mb-1">ما هو Cloudflare Turnstile؟</p>
                        <p className="text-blue-400/80">نظام حماية ذكي من Cloudflare يحمي نماذج تسجيل الدخول والتسجيل من الهجمات الآلية (بديل لـ reCAPTCHA)</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Site Key</label>
                      <input
                        type="text"
                        value={apiKeys.turnstile_site_key}
                        onChange={(e) => setApiKeys({...apiKeys, turnstile_site_key: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                        placeholder="0x4AAAAAAA..."
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 mt-1">المفتاح العام (يُستخدم في الـ Frontend)</p>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Secret Key</label>
                      <input
                        type="password"
                        value={apiKeys.turnstile_secret_key}
                        onChange={(e) => setApiKeys({...apiKeys, turnstile_secret_key: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 mt-1">المفتاح السري (يُستخدم في الـ Backend للتحقق)</p>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            </div>
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
