'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <nav className="navbar absolute bg-transparent border-b-0">
        <div className="navbar-container">
          <div className="navbar-logo">
            <div className="navbar-logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className="navbar-logo-text">
              <h2>منصة التعليم</h2>
              <span>بوابتك للمستقبل</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex gap-4">
            <Link href="/login" className="btn btn-outline text-white border-white/20">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="btn btn-primary">
              حساب جديد
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            منصة تعليمية متكاملة <br />
            <span className="text-primary">لإدارة العملية التعليمية</span>
          </h1>
          <p className="hero-subtitle">
            نظام شامل يربط بين الطلاب والمعلمين وأولياء الأمور. إدارة سهلة للمحاضرات، الامتحانات، والواجبات مع تحليلات دقيقة للأداء.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn btn-primary btn-lg">
              <i className="fas fa-rocket"></i>
              ابدأ الآن
            </Link>
            <Link href="#features" className="btn btn-outline btn-lg text-white border-white/20">
              <i className="fas fa-info-circle"></i>
              المزيد من التفاصيل
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[2.5rem] font-bold mb-4">مميزات المنصة</h2>
            <p className="text-gray-light text-[1.1rem]">كل ما تحتاجه لإدارة تعليمية ناجحة في مكان واحد</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <h3 className="feature-title">للمعلمين</h3>
              <p className="feature-description">
                إدارة شاملة للطلاب، المحاضرات، والامتحانات. متابعة الحضور والغياب وإصدار تقارير تفصيلية بضغطة زر.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-user-graduate"></i>
              </div>
              <h3 className="feature-title">للطلاب</h3>
              <p className="feature-description">
                وصول سهل للمحتوى التعليمي، حل الواجبات والامتحانات أونلاين، ومتابعة مستوى التقدم والدرجات أولاً بأول.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="feature-title">تحليلات متقدمة</h3>
              <p className="feature-description">
                لوحات تحكم تفاعلية تعرض إحصائيات دقيقة عن الأداء المالي والأكاديمي، مما يساعد في اتخاذ قرارات مدروسة.
              </p>
            </div>
             <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 className="feature-title">أمان وخصوصية</h3>
              <p className="feature-description">
                نظام حماية متطور لبيانات المستخدمين مع صلاحيات وصول دقيقة لضمان خصوصية المعلومات وأمانها.
              </p>
            </div>
             <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="feature-title">تطبيق جوال</h3>
              <p className="feature-description">
                تجربة مستخدم سلسة على جميع الأجهزة الذكية، مما يتيح الوصول للمنصة في أي وقت ومن أي مكان.
              </p>
            </div>
             <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3 className="feature-title">دعم فني</h3>
              <p className="feature-description">
                فريق دعم فني متخصص جاهز للمساعدة في حل أي مشكلة تقنية قد تواجهك لضمان استمرارية العمل.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container mx-auto">
          <p>© 2024 منصة التعليم. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
