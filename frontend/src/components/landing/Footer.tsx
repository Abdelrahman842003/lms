'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <>
      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">ابدأ رحلتك التعليمية الآن</h2>
          <p className="cta-subtitle">
            انضم إلى آلاف المعلمين والطلاب الذين يستخدمون منصتنا لتحسين العملية التعليمية.
          </p>
          <div className="cta-actions">
            <Link href="/login" className="hero-btn hero-btn-primary">
              جرّب المنصة مجانًا
            </Link>
            <Link href="/contact" className="hero-btn hero-btn-secondary">
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <ul className="footer-links">
            <li><Link href="/privacy">الخصوصية</Link></li>
            <li><Link href="/terms">الاستخدام</Link></li>
            <li><Link href="/contact">تواصل معنا</Link></li>
          </ul>
          <p className="footer-copyright">
            © {new Date().getFullYear()} منصة التعليم. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </>
  );
}
