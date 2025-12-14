'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="hero-section" style={{ backgroundImage: 'url(/hero-bg.jpg)' }}>
        <div className="hero-content">
          <h1 className="hero-title">
            منصة تعليمية متكاملة <br />
            <span className="text-primary">لإدارة العملية التعليمية</span>
          </h1>
          <p className="hero-subtitle">
            نظام شامل يربط بين الطلاب والمعلمين وأولياء الأمور. إدارة سهلة للمحاضرات، الامتحانات، والواجبات مع تحليلات دقيقة للأداء.
          </p>
          <div className="hero-actions flex gap-4 justify-center">
            <Link href="/login" className="btn btn-primary btn-lg">
              <i className="fas fa-rocket ml-2"></i>
              ابدأ الآن
            </Link>

          </div>
        </div>
      </section>
    
  );
}
