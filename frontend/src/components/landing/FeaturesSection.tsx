'use client';

import React from 'react';

const features = [
  {
    icon: 'fas fa-chalkboard-teacher',
    title: 'إدارة المحاضرات',
    description: 'أنشئ وجدول محاضراتك بسهولة. تتبع الحضور والغياب بشكل تلقائي.'
  },
  {
    icon: 'fas fa-users',
    title: 'متابعة الطلاب',
    description: 'تابع أداء كل طالب بشكل فردي. اطلع على نقاط القوة والضعف.'
  },
  {
    icon: 'fas fa-clipboard-check',
    title: 'الامتحانات والواجبات',
    description: 'أنشئ امتحانات متنوعة وواجبات. تصحيح تلقائي وتقارير فورية.'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'تقارير الأداء',
    description: 'تقارير شاملة ومفصلة لأداء الطلاب والفصول الدراسية.'
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-section-header">
        <h2 className="landing-section-title">إدارة تعليمية، سهلة، وذكية</h2>
        <p className="landing-section-subtitle">
          مع منصتنا، يمكنك التنسيق بين الطلاب والمعلمين، وتتبع العملية التعليمية 
          بطرق عرض مرنة، والحفاظ على الجميع متوافقين من البداية إلى النهاية.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">
              <i className={feature.icon}></i>
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
