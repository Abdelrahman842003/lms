import Link from 'next/link';
import { landingContentFallback, landingPlansFallback, type LandingContent, type LandingPlansCatalog, type LandingPublicPlan } from '@/config/landingDefaults';

interface LandingPageProps {
  settings?: Record<string, unknown> | null;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;

  try {
    const parsed = JSON.parse(value);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeContent(raw: unknown): LandingContent {
  const parsed = parseJson<Partial<LandingContent>>(raw, {});

  return {
    navbar: {
      ...landingContentFallback.navbar,
      ...(parsed.navbar ?? {}),
      links: Array.isArray(parsed.navbar?.links) && parsed.navbar.links.length > 0
        ? parsed.navbar.links
        : landingContentFallback.navbar.links,
    },
    hero: {
      ...landingContentFallback.hero,
      ...(parsed.hero ?? {}),
    },
    features: Array.isArray(parsed.features) && parsed.features.length > 0
      ? parsed.features
      : landingContentFallback.features,
    how_it_works: Array.isArray(parsed.how_it_works) && parsed.how_it_works.length > 0
      ? parsed.how_it_works
      : landingContentFallback.how_it_works,
    footer: {
      ...landingContentFallback.footer,
      ...(parsed.footer ?? {}),
    },
  };
}

function normalizePlans(raw: unknown): LandingPlansCatalog {
  const parsed = parseJson<LandingPlansCatalog>(raw, landingPlansFallback);

  if (!Array.isArray(parsed?.plans) || parsed.plans.length === 0) {
    return landingPlansFallback;
  }

  return {
    version: parsed.version || 1,
    targets: Array.isArray(parsed.targets) ? parsed.targets : ['teacher', 'academy'],
    plans: parsed.plans,
  };
}

function buildWhatsAppUrl(rawNumber: string): string | null {
  const normalized = rawNumber.replace(/[^0-9]/g, '');
  if (!normalized) return null;

  return `https://wa.me/${normalized}?text=${encodeURIComponent('السلام عليكم، أريد معرفة تفاصيل الباقات')}`;
}

function sortPlans(plans: LandingPublicPlan[]): LandingPublicPlan[] {
  const packageOrder: Record<string, number> = { basic: 1, pro: 2, max: 3 };

  return [...plans].sort((a, b) => {
    if (a.seat_tier !== b.seat_tier) return a.seat_tier - b.seat_tier;
    return (packageOrder[a.package] ?? 99) - (packageOrder[b.package] ?? 99);
  });
}

export default function LandingPage({ settings }: LandingPageProps) {
  const content = normalizeContent(settings?.landing_content_json ?? settings?.landingContentJson);
  const catalog = normalizePlans(settings?.landing_plans_public_json ?? settings?.landingPlansPublicJson);
  const whatsappUrl = buildWhatsAppUrl(String(settings?.whatsappNumber ?? settings?.support_phone ?? settings?.supportPhone ?? ''));

  const teacherPlans = sortPlans(catalog.plans.filter((plan) => plan.target === 'teacher'));
  const academyPlans = sortPlans(catalog.plans.filter((plan) => plan.target === 'academy'));
  const targetBlocks = [
    { key: 'teacher', title: 'باقات المدرسين', plans: teacherPlans },
    { key: 'academy', title: 'باقات الأكاديميات', plans: academyPlans },
  ];

  return (
    <div className="landing-v2">
      <header className="landing-v2-navbar">
        <div className="landing-v2-brand">{content.navbar.brand}</div>
        <nav className="landing-v2-links">
          {content.navbar.links.map((link) => (
            <a key={`${link.href}-${link.label}`} href={link.href}>{link.label}</a>
          ))}
        </nav>
        <div className="landing-v2-actions">
          <Link href="/login" className="landing-v2-btn landing-v2-btn-outline">{content.navbar.login_label}</Link>
          <a
            href={whatsappUrl ?? '#'}
            target={whatsappUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="landing-v2-btn landing-v2-btn-primary"
          >
            {content.navbar.contact_label}
          </a>
        </div>
      </header>

      <section className="landing-v2-hero">
        <span className="landing-v2-hero-badge">{content.hero.badge}</span>
        <h1>{content.hero.title}</h1>
        <p>{content.hero.subtitle}</p>
        <div className="landing-v2-actions landing-v2-hero-actions">
          <Link href="/login" className="landing-v2-btn landing-v2-btn-primary">{content.hero.primary_cta}</Link>
          <a
            href={whatsappUrl ?? '#'}
            target={whatsappUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="landing-v2-btn landing-v2-btn-outline"
          >
            {content.hero.secondary_cta}
          </a>
        </div>
      </section>

      <section id="features" className="landing-v2-section">
        <h2>أهم مميزاتنا</h2>
        <div className="landing-v2-features-grid">
          {content.features.map((feature) => (
            <article key={feature.title} className="landing-v2-feature-card">
              <i className={`fas fa-${feature.icon}`} aria-hidden="true" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="plans" className="landing-v2-section">
        <h2>الباقات</h2>
        {targetBlocks.map((block) => (
          <div key={block.key} className="landing-v2-plan-target">
            <h3>{block.title}</h3>
            <div className="landing-v2-plans-grid">
              {block.plans.map((plan) => (
                <article key={`${block.key}-${plan.code}`} className={`landing-v2-plan-card ${plan.is_featured ? 'featured' : ''}`}>
                  <div className="landing-v2-plan-head">
                    <span className="seat-tier">{plan.seat_tier} مقعد</span>
                    <span className="plan-package">{String(plan.package).toUpperCase()}</span>
                  </div>
                  <h4>{plan.label_ar}</h4>
                  <p className="plan-price">{plan.public_price_label_ar || 'تواصل معنا'}</p>
                  <p className="plan-billing">دورة الفوترة: {plan.billing_cycle_months} شهر</p>
                  <ul>
                    {(plan.features_ar ?? []).slice(0, 4).map((feature) => (
                      <li key={`${plan.code}-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                  <div className="plan-meta">
                    <span>AI: {plan.entitlements?.ai_ui_enabled ? 'قريبًا' : 'غير متاح'}</span>
                    <span>Storage: {plan.entitlements?.video_storage_gb ?? 0} GB</span>
                  </div>
                  <a
                    href={whatsappUrl ?? '#'}
                    target={whatsappUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="landing-v2-btn landing-v2-btn-primary"
                  >
                    تواصل معنا
                  </a>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="landing-v2-section">
        <h2>كيفية استخدام المنصة</h2>
        <div className="landing-v2-flow-grid">
          {content.how_it_works.map((item, index) => (
            <article key={`${item.audience}-${index}`} className="landing-v2-flow-card">
              <span className="flow-audience">{item.audience}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-v2-footer">
        <h3>{content.footer.headline}</h3>
        <p>{content.footer.description}</p>
        <small>{content.footer.copyright}</small>
      </footer>
    </div>
  );
}

