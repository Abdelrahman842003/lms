'use client';

import Link from 'next/link';

interface AppNotFoundProps {
  title?: string;
  description?: string;
  hint?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function AppNotFound({
  title = 'الصفحة غير موجودة',
  description = 'الرابط الذي حاولت الوصول إليه غير متاح الآن. يمكنك الرجوع إلى الصفحة الرئيسية أو المتابعة من لوحة التحكم.',
  hint = 'تلميح: تأكد من الرابط، أو ارجع من الأزرار الجاهزة.',
  actionHref = '/',
  actionLabel = 'الذهاب للرئيسية',
}: AppNotFoundProps) {
  return (
    <main className="relative z-10 flex min-h-[72vh] items-center px-4 py-10 md:px-8">
      <div className="relative mx-auto w-full max-w-5xl">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-52 w-52 rounded-full bg-amber-400/20 blur-3xl" />

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/45 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="h-1 w-full bg-gradient-to-l from-cyan-300/70 via-indigo-400/70 to-amber-300/70" />

          <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90">
                  ERROR 404
                </span>
                <p className="mt-4 text-7xl font-black leading-none text-white/95 md:text-8xl">
                  404
                </p>
                <p className="mt-3 text-sm text-white/65 md:text-base">
                  الصفحة المطلوبة غير موجودة أو تم نقلها لمسار آخر.
                </p>
              </div>

              <div className="mt-8 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70 md:text-sm">
                {hint}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-extrabold leading-tight text-white md:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={actionHref}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-l from-indigo-600 to-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:from-indigo-500 hover:to-blue-400"
                >
                  {actionLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
