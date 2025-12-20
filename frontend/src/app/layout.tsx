import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import '@/styles/components.css'
import '@/styles/layout.css'
import '@/styles/pages/login.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup'

export const metadata: Metadata = {
    title: 'المنصة التعليمية | Educational Platform',
    description: 'نظام شامل يربط بين الطلاب والمعلمين وأولياء الأمور. إدارة سهلة للمحاضرات، الامتحانات، والواجبات مع تحليلات دقيقة للأداء.',
    keywords: 'تعليم، منصة تعليمية، طلاب، معلمين، امتحانات، واجبات، تعليم إلكتروني',
    authors: [{ name: 'Educational Platform Team' }],
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
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
                
            </head>
            <body
                className="max-w-[2000px] mx-auto"
                suppressHydrationWarning={true}
            >
                <div className="grid-pattern" />
                <AuthProvider>
                  <ServiceWorkerCleanup />
                  <div className="max-w-[1200px] mx-auto">
                    {children}
                    <Toaster position="top-center" />
                  </div>
                </AuthProvider>
            </body>
        </html>
    )
}