import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import '@/styles/globals.css'
import '@/styles/components.css'
import '@/styles/layout.css'
import '@/styles/pages/login.css'
import { AuthProvider } from '@/contexts/EnhancedAuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup'
import InstallPrompt from '@/components/InstallPrompt'
import MaintenanceGuard from '@/components/MaintenanceGuard';
import SeasonalDecorations from '@/components/SeasonalDecorations';
import { resolveSeasonalThemeFromSettings } from '@/lib/seasonalTheme';

// Fetch SEO settings from API
const getSeoSettings = async () => {
    try {
        let apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        // Normalize base URL to avoid double /api when INTERNAL_API_URL contains /api.
        apiUrl = apiUrl
            .replace(/\/api\/v\d+\/?$/, '')
            .replace(/\/api\/?$/, '')
            .replace(/\/$/, '');
        
        // Add timeout to prevent build hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const res = await fetch(`${apiUrl}/api/v1/public-settings`, {
            cache: 'no-store',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.warn('Failed to fetch SEO settings (using defaults):', error);
        return null;
    }
};

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSeoSettings();
    
    return {
        title: settings?.seo_title || settings?.siteName || 'المنصة التعليمية | Educational Platform',
        description: settings?.seo_description || settings?.siteDescription || 'نظام شامل يربط بين الطلاب والمعلمين وأولياء الأمور.',
        keywords: settings?.seo_keywords || 'تعليم، منصة تعليمية، طلاب، معلمين، امتحانات',
        authors: [{ name: 'Educational Platform Team' }],
        openGraph: {
            title: settings?.seo_title || settings?.siteName || 'المنصة التعليمية',
            description: settings?.seo_description || settings?.siteDescription || 'نظام تعليمي متكامل',
            images: settings?.seo_og_image ? [settings.seo_og_image] : [],
            type: 'website',
        },
        verification: {
            google: settings?.seo_google_verification || undefined,
            other: settings?.seo_bing_verification ? { 'msvalidate.01': settings.seo_bing_verification } : undefined,
        },
        icons: {
            icon: '/logo.png',
            apple: '/logo.png',
        },
    };
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#4263EB',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getSeoSettings();
    const seasonalTheme = resolveSeasonalThemeFromSettings(settings ?? {});
    
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: settings?.seo_title || settings?.siteName || 'المنصة التعليمية',
        url: 'https://neetaq.com',
        description: settings?.seo_description || settings?.siteDescription,
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://neetaq.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
        }
    };

    const maintenanceMode = settings?.maintenanceMode === 'true';

    return (
    <html lang="ar" dir="rtl" className="h-full" data-scroll-behavior="smooth">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
                <link 
                    rel="stylesheet" 
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
                    integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
                    crossOrigin="anonymous" 
                    referrerPolicy="no-referrer"
                />
                
                <link rel="manifest" href="/manifest.json" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body
                className="max-w-[2000px] mx-auto"
                data-season-theme={seasonalTheme.theme}
                style={seasonalTheme.cssVariables as CSSProperties}
                suppressHydrationWarning={true}
            >
                <div className="grid-pattern" />
                <SettingsProvider>
                <SeasonalDecorations initialTheme={seasonalTheme.theme} />
                <AuthProvider>
                  <ServiceWorkerCleanup />
                  <InstallPrompt />
                  <MaintenanceGuard maintenanceMode={maintenanceMode}>
                    <div className="relative z-10 max-w-[1200px] mx-auto">
                        {children}
                    </div>
                    <Toaster position="top-center" />
                  </MaintenanceGuard>
                </AuthProvider>
                </SettingsProvider>
            </body>
        </html>
    )

}
