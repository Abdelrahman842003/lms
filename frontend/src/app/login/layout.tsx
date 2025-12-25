import type { Metadata } from 'next'

async function getSeoSettings() {
    try {
        const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${apiUrl}/public-settings`, {
            next: { revalidate: 3600 },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.warn('Failed to fetch Login SEO settings (using defaults):', error);
        return null;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSeoSettings();
    const siteName = settings?.seo_title || settings?.siteName || 'المنصة التعليمية';
    
    return {
        title: `تسجيل الدخول | ${siteName}`,
        description: 'سجل دخولك الآن للوصول إلى المحاضرات والامتحانات.',
        openGraph: {
            title: `تسجيل الدخول | ${siteName}`,
            description: 'سجل دخولك الآن للوصول إلى المحاضرات والامتحانات.',
        }
    };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
