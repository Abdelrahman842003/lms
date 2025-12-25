import type { Metadata } from 'next'

async function getSeoSettings() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/settings`, {
            next: { revalidate: 3600 }
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
