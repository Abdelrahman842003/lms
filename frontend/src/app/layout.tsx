import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import '@/styles/components.css'
import '@/styles/layout.css'
import '@/styles/pages/login.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup'
import InstallPrompt from '@/components/InstallPrompt'

// Fetch SEO settings from API
async function getSeoSettings() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/settings`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data;
    } catch {
        return null;
    }
}

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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl" className="h-full">
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
            </head>
            <body
                className="max-w-[2000px] mx-auto"
                suppressHydrationWarning={true}
            >
                <div className="grid-pattern" />
                <AuthProvider>
                  <ServiceWorkerCleanup />
                  <InstallPrompt />
                  <div className="max-w-[1200px] mx-auto">
                    {children}
                    <Toaster position="top-center" />
                  </div>
                </AuthProvider>
            </body>
        </html>
    )
}