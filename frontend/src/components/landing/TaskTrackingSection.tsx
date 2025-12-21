'use client';

import React from 'react';

const taskFeatures = [
  {
    title: 'مسارات تعليمية مخصصة',
    description: 'تابع تقدم الطلاب عبر مسارات مصممة خصيصًا لكل مادة.'
  },
  {
    title: 'عروض متنوعة للمحتوى',
    description: 'تنقّل بين القائمة والجدول والتقويم لعرض المحاضرات.'
  },
  {
    title: 'تصفية وبحث متقدم',
    description: 'قم بتصفية الطلاب والمحاضرات للوصول لما تحتاجه بسرعة.'
  },
  {
    title: 'جدولة تلقائية',
    description: 'تطبيق المواعيد والتذكيرات تلقائيًا على المحاضرات.'
  }
];

export default function TaskTrackingSection() {
  return (
    <section id="tracking" className="landing-section task-section">
      <div className="landing-section-header">
        <h2 className="landing-section-title">إدارة وتتبّع التعليم بشكل متكامل</h2>
        <p className="landing-section-subtitle">
          مصمّم للسرعة والكفاءة. تابع كل المحاضرات بسهولة، خطّط الجداول بمرونة، 
          وحافظ على سير العملية التعليمية منظمًا وواضحًا للجميع.
        </p>
      </div>

      <div className="task-grid">
        {taskFeatures.map((feature, index) => (
          <div key={index} className="task-card">
            <h3 className="task-card-title">{feature.title}</h3>
            <p className="task-card-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
