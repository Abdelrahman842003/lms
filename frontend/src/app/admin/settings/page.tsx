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
  });

  const [firebaseSettings, setFirebaseSettings] = useState({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDuWnTpPZDolIt20XyB0h9ylWzDCs0H_b4',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'neetaq-54091.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'neetaq-54091',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'neetaq-54091.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '962831721396',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:962831721396:web:99b9ffc5296043dd2b88e1',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-BQP5416BDV',
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BLX0Q9WJ5rsdXShkjYVPxjO1D3LAvJjaKUmLkd1_c58Bpgv7fX2FevnBw3FAZJT2rwXTUuAcsxRaPhwT2rBgewM',
    credentialsPath: '/home/abdelrahman/Desktop/New Folder/backend/storage/firebase/service-account.json',
  });

  const [cloudflareSettings, setCloudflareSettings] = useState({
    r2AccessKeyId: 'eb8a01974474ce5cccf346a1134b4e6d',
    r2SecretAccessKey: '971157c8034f24a255793d68b0d4e28929a6b0c9bfe37fcb0ac4c558f399d402',
    r2Bucket: 'neetaq-storage',
    r2Endpoint: 'https://6191d19f414140d7a65bcbbf2196f531.r2.cloudflarestorage.com',
    r2PublicUrl: 'https://pub-746da0a4c15a4827839ee78e9116084e.r2.dev',
    kvAccountId: '6191d19f414140d7a65bcbbf2196f531',
    kvNamespaceId: 'a6c5deff0f98488ca66dc4cabaea68f3',
    kvApiToken: '7j1bzqUqCA7zlKio5CW1uOXP3nU5-JqZqbva6Zkx',
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

        // Update Firebase Settings
        setFirebaseSettings(prev => ({
          ...prev,
          apiKey: data.firebaseApiKey || prev.apiKey,
          authDomain: data.firebaseAuthDomain || prev.authDomain,
          projectId: data.firebaseProjectId || prev.projectId,
          storageBucket: data.firebaseStorageBucket || prev.storageBucket,
          messagingSenderId: data.firebaseMessagingSenderId || prev.messagingSenderId,
          appId: data.firebaseAppId || prev.appId,
          measurementId: data.firebaseMeasurementId || prev.measurementId,
          vapidKey: data.firebaseVapidKey || prev.vapidKey,
          credentialsPath: data.firebaseCredentialsPath || prev.credentialsPath,
        }));

        // Update Cloudflare Settings
        setCloudflareSettings(prev => ({
          ...prev,
          r2AccessKeyId: data.r2AccessKeyId || prev.r2AccessKeyId,
          r2SecretAccessKey: data.r2SecretAccessKey || prev.r2SecretAccessKey,
          r2Bucket: data.r2Bucket || prev.r2Bucket,
          r2Endpoint: data.r2Endpoint || prev.r2Endpoint,
          r2PublicUrl: data.r2PublicUrl || prev.r2PublicUrl,
          kvAccountId: data.kvAccountId || prev.kvAccountId,
          kvNamespaceId: data.kvNamespaceId || prev.kvNamespaceId,
          kvApiToken: data.kvApiToken || prev.kvApiToken,
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
      
      // Firebase
      { key: 'firebaseApiKey', value: firebaseSettings.apiKey, group: 'firebase' },
      { key: 'firebaseAuthDomain', value: firebaseSettings.authDomain, group: 'firebase' },
      { key: 'firebaseProjectId', value: firebaseSettings.projectId, group: 'firebase' },
      { key: 'firebaseStorageBucket', value: firebaseSettings.storageBucket, group: 'firebase' },
      { key: 'firebaseMessagingSenderId', value: firebaseSettings.messagingSenderId, group: 'firebase' },
      { key: 'firebaseAppId', value: firebaseSettings.appId, group: 'firebase' },
      { key: 'firebaseMeasurementId', value: firebaseSettings.measurementId, group: 'firebase' },
      { key: 'firebaseVapidKey', value: firebaseSettings.vapidKey, group: 'firebase' },
      { key: 'firebaseCredentialsPath', value: firebaseSettings.credentialsPath, group: 'firebase' },

      // Cloudflare
      { key: 'r2AccessKeyId', value: cloudflareSettings.r2AccessKeyId, group: 'cloudflare' },
      { key: 'r2SecretAccessKey', value: cloudflareSettings.r2SecretAccessKey, group: 'cloudflare' },
      { key: 'r2Bucket', value: cloudflareSettings.r2Bucket, group: 'cloudflare' },
      { key: 'r2Endpoint', value: cloudflareSettings.r2Endpoint, group: 'cloudflare' },
      { key: 'r2PublicUrl', value: cloudflareSettings.r2PublicUrl, group: 'cloudflare' },
      { key: 'kvAccountId', value: cloudflareSettings.kvAccountId, group: 'cloudflare' },
      { key: 'kvNamespaceId', value: cloudflareSettings.kvNamespaceId, group: 'cloudflare' },
      { key: 'kvApiToken', value: cloudflareSettings.kvApiToken, group: 'cloudflare' },
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
    { id: 'firebase', label: 'Firebase', icon: 'fas fa-fire' },
    { id: 'cloudflare', label: 'Cloudflare R2', icon: 'fas fa-cloud' },
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
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">اسم الموقع</label>
                    <input
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">وصف الموقع</label>
                    <input
                      type="text"
                      value={generalSettings.siteDescription}
                      onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
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

          {/* Firebase Settings */}
          {activeTab === 'firebase' && (
            <DashboardCard title="إعدادات Firebase" icon="fas fa-fire">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-gray-300 mb-2 text-sm">VAPID Key (Web Push)</label>
                  <input
                    type="text"
                    value={firebaseSettings.vapidKey}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, vapidKey: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    placeholder="NEXT_PUBLIC_FIREBASE_VAPID_KEY"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">API Key</label>
                  <input
                    type="text"
                    value={firebaseSettings.apiKey}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, apiKey: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Auth Domain</label>
                  <input
                    type="text"
                    value={firebaseSettings.authDomain}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, authDomain: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Project ID</label>
                  <input
                    type="text"
                    value={firebaseSettings.projectId}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, projectId: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Storage Bucket</label>
                  <input
                    type="text"
                    value={firebaseSettings.storageBucket}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, storageBucket: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Messaging Sender ID</label>
                  <input
                    type="text"
                    value={firebaseSettings.messagingSenderId}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, messagingSenderId: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">App ID</label>
                  <input
                    type="text"
                    value={firebaseSettings.appId}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, appId: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-gray-300 mb-2 text-sm">Service Account Credentials Path (Backend)</label>
                  <input
                    type="text"
                    value={firebaseSettings.credentialsPath}
                    onChange={(e) => setFirebaseSettings({...firebaseSettings, credentialsPath: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    placeholder="/path/to/service-account.json"
                  />
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Cloudflare Settings */}
          {activeTab === 'cloudflare' && (
            <DashboardCard title="إعدادات Cloudflare R2" icon="fas fa-cloud">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">R2 Access Key ID</label>
                    <input
                      type="text"
                      value={cloudflareSettings.r2AccessKeyId}
                      onChange={(e) => setCloudflareSettings({...cloudflareSettings, r2AccessKeyId: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">R2 Secret Access Key</label>
                    <input
                      type="password"
                      value={cloudflareSettings.r2SecretAccessKey}
                      onChange={(e) => setCloudflareSettings({...cloudflareSettings, r2SecretAccessKey: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">R2 Bucket Name</label>
                    <input
                      type="text"
                      value={cloudflareSettings.r2Bucket}
                      onChange={(e) => setCloudflareSettings({...cloudflareSettings, r2Bucket: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">R2 Endpoint</label>
                    <input
                      type="text"
                      value={cloudflareSettings.r2Endpoint}
                      onChange={(e) => setCloudflareSettings({...cloudflareSettings, r2Endpoint: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-gray-300 mb-2 text-sm">R2 Public URL (Custom Domain)</label>
                    <input
                      type="text"
                      value={cloudflareSettings.r2PublicUrl}
                      onChange={(e) => setCloudflareSettings({...cloudflareSettings, r2PublicUrl: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                      placeholder="https://cdn.example.com"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <i className="fas fa-database text-secondary"></i>
                    إعدادات KV Storage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Account ID</label>
                      <input
                        type="text"
                        value={cloudflareSettings.kvAccountId}
                        onChange={(e) => setCloudflareSettings({...cloudflareSettings, kvAccountId: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Namespace ID</label>
                      <input
                        type="text"
                        value={cloudflareSettings.kvNamespaceId}
                        onChange={(e) => setCloudflareSettings({...cloudflareSettings, kvNamespaceId: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-gray-300 mb-2 text-sm">API Token</label>
                      <input
                        type="password"
                        value={cloudflareSettings.kvApiToken}
                        onChange={(e) => setCloudflareSettings({...cloudflareSettings, kvApiToken: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
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
