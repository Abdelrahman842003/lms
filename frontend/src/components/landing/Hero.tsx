'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/services/authService';

const animatedWords = ['معلم', 'طالب', 'ولي أمر', 'سكرتير'];

type ActivePage = 'home' | 'students' | 'lectures' | 'exams' | 'reports' | 'settings';

export default function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [showMagic, setShowMagic] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle page change with magic animation
  const handlePageChange = (page: ActivePage) => {
    if (page !== activePage) {
      setShowMagic(true);
      setMobileMenuOpen(false);
      setTimeout(() => {
        setActivePage(page);
        setTimeout(() => setShowMagic(false), 800);
      }, 400);
    } else {
      setMobileMenuOpen(false);
    }
  };

  // Get page label
  const getPageLabel = (page: ActivePage) => {
    const labels: Record<ActivePage, string> = {
      home: 'الرئيسية',
      students: 'الطلاب',
      lectures: 'المحاضرات',
      exams: 'الامتحانات',
      reports: 'التقارير',
      settings: 'الإعدادات'
    };
    return labels[page];
  };

  // Fetch WhatsApp number from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await fetchApi('/public-settings', { method: 'GET' });
        if (data?.whatsappNumber) {
          setWhatsappNumber(data.whatsappNumber);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const currentWord = animatedWords[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % animatedWords.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex]);

  const renderMainContent = () => {
    switch (activePage) {
      case 'students':
        return (
          <>
            <div className="welcome-section-3d">
              <div className="welcome-text">
                <h3>إدارة الطلاب 👨‍🎓</h3>
                <p>تتبع أداء الطلاب وإدارة بياناتهم بسهولة</p>
              </div>
            </div>
            <div className="stats-row-3d">
              <div className="stat-card-3d purple">
                <div className="stat-icon-3d"><i className="fas fa-user-plus"></i></div>
                <div className="stat-number-3d">٢٥</div>
                <div className="stat-label-3d">طالب جديد</div>
              </div>
              <div className="stat-card-3d blue">
                <div className="stat-icon-3d"><i className="fas fa-user-check"></i></div>
                <div className="stat-number-3d">١٢٠</div>
                <div className="stat-label-3d">طالب نشط</div>
              </div>
              <div className="stat-card-3d green">
                <div className="stat-icon-3d"><i className="fas fa-graduation-cap"></i></div>
                <div className="stat-number-3d">٩٥٪</div>
                <div className="stat-label-3d">نسبة النجاح</div>
              </div>
            </div>
            <div className="table-section-3d">
              <div className="table-header-row">
                <span className="col-name">اسم الطالب</span>
                <span className="col-status">المجموعة</span>
                <span className="col-progress">الحضور</span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">أحمد محمد علي</span>
                <span className="col-status"><span className="status-badge active">المجموعة أ</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill" style={{width: '95%'}}></div></div></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">سارة أحمد</span>
                <span className="col-status"><span className="status-badge active">المجموعة ب</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill" style={{width: '88%'}}></div></div></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">محمد خالد</span>
                <span className="col-status"><span className="status-badge pending">المجموعة ج</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill orange" style={{width: '72%'}}></div></div></span>
              </div>
            </div>
          </>
        );
      
      case 'lectures':
        return (
          <>
            <div className="welcome-section-3d">
              <div className="welcome-text">
                <h3>جدول المحاضرات 📚</h3>
                <p>إدارة المحاضرات والجداول الدراسية</p>
              </div>
            </div>
            <div className="stats-row-3d">
              <div className="stat-card-3d blue">
                <div className="stat-icon-3d"><i className="fas fa-calendar-check"></i></div>
                <div className="stat-number-3d">٨</div>
                <div className="stat-label-3d">محاضرة اليوم</div>
              </div>
              <div className="stat-card-3d purple">
                <div className="stat-icon-3d"><i className="fas fa-clock"></i></div>
                <div className="stat-number-3d">٢٤</div>
                <div className="stat-label-3d">ساعة أسبوعياً</div>
              </div>
              <div className="stat-card-3d green">
                <div className="stat-icon-3d"><i className="fas fa-video"></i></div>
                <div className="stat-number-3d">١٢</div>
                <div className="stat-label-3d">تسجيل متاح</div>
              </div>
            </div>
            <div className="table-section-3d">
              <div className="table-header-row">
                <span className="col-name">اسم المحاضرة</span>
                <span className="col-status">الوقت</span>
                <span className="col-progress">الحالة</span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">الرياضيات - الوحدة ٣</span>
                <span className="col-status">٩:٠٠ ص</span>
                <span className="col-progress"><span className="status-badge active">مكتملة</span></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">الفيزياء - المراجعة</span>
                <span className="col-status">١١:٠٠ ص</span>
                <span className="col-progress"><span className="status-badge pending">قادمة</span></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">الكيمياء العضوية</span>
                <span className="col-status">٢:٠٠ م</span>
                <span className="col-progress"><span className="status-badge pending">قادمة</span></span>
              </div>
            </div>
          </>
        );
      
      case 'exams':
        return (
          <>
            <div className="welcome-section-3d">
              <div className="welcome-text">
                <h3>الامتحانات والواجبات ✍️</h3>
                <p>إنشاء وإدارة الامتحانات والواجبات</p>
              </div>
            </div>
            <div className="stats-row-3d">
              <div className="stat-card-3d green">
                <div className="stat-icon-3d"><i className="fas fa-check-circle"></i></div>
                <div className="stat-number-3d">١٥</div>
                <div className="stat-label-3d">امتحان مكتمل</div>
              </div>
              <div className="stat-card-3d blue">
                <div className="stat-icon-3d"><i className="fas fa-hourglass-half"></i></div>
                <div className="stat-number-3d">٣</div>
                <div className="stat-label-3d">في الانتظار</div>
              </div>
              <div className="stat-card-3d purple">
                <div className="stat-icon-3d"><i className="fas fa-star"></i></div>
                <div className="stat-number-3d">٨٧٪</div>
                <div className="stat-label-3d">متوسط الدرجات</div>
              </div>
            </div>
            <div className="table-section-3d">
              <div className="table-header-row">
                <span className="col-name">اسم الامتحان</span>
                <span className="col-status">النوع</span>
                <span className="col-progress">المشاركون</span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">امتحان نهاية الوحدة ٣</span>
                <span className="col-status"><span className="status-badge active">اختياري</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill" style={{width: '100%'}}></div></div></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">واجب الفيزياء</span>
                <span className="col-status"><span className="status-badge pending">مقالي</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill" style={{width: '75%'}}></div></div></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">اختبار سريع</span>
                <span className="col-status"><span className="status-badge active">اختياري</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill orange" style={{width: '45%'}}></div></div></span>
              </div>
            </div>
          </>
        );
      
      case 'reports':
        return (
          <>
            <div className="welcome-section-3d">
              <div className="welcome-text">
                <h3>التقارير والإحصائيات 📊</h3>
                <p>تحليلات شاملة لأداء الطلاب والمحاضرات</p>
              </div>
            </div>
            <div className="stats-row-3d">
              <div className="stat-card-3d purple">
                <div className="stat-icon-3d"><i className="fas fa-chart-line"></i></div>
                <div className="stat-number-3d">↑ ١٥٪</div>
                <div className="stat-label-3d">نمو شهري</div>
              </div>
              <div className="stat-card-3d green">
                <div className="stat-icon-3d"><i className="fas fa-trophy"></i></div>
                <div className="stat-number-3d">٤٥</div>
                <div className="stat-label-3d">متفوق</div>
              </div>
              <div className="stat-card-3d blue">
                <div className="stat-icon-3d"><i className="fas fa-file-pdf"></i></div>
                <div className="stat-number-3d">٢٨</div>
                <div className="stat-label-3d">تقرير جاهز</div>
              </div>
            </div>
            <div className="table-section-3d">
              <div className="table-header-row">
                <span className="col-name">اسم التقرير</span>
                <span className="col-status">التاريخ</span>
                <span className="col-progress">الحالة</span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">تقرير الأداء الشهري</span>
                <span className="col-status">ديسمبر ٢٠٢٤</span>
                <span className="col-progress"><span className="status-badge active">جاهز</span></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">إحصائيات الحضور</span>
                <span className="col-status">أسبوعي</span>
                <span className="col-progress"><span className="status-badge active">جاهز</span></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">تحليل نتائج الامتحانات</span>
                <span className="col-status">نوفمبر ٢٠٢٤</span>
                <span className="col-progress"><span className="status-badge pending">قيد الإعداد</span></span>
              </div>
            </div>
          </>
        );
      
      case 'settings':
        return (
          <>
            <div className="welcome-section-3d">
              <div className="welcome-text">
                <h3>الإعدادات ⚙️</h3>
                <p>تخصيص إعدادات حسابك والمنصة</p>
              </div>
            </div>
            <div className="settings-grid">
              <div className="setting-card">
                <div className="setting-icon"><i className="fas fa-user-circle"></i></div>
                <div className="setting-info">
                  <h4>الملف الشخصي</h4>
                  <p>تعديل بيانات الحساب</p>
                </div>
              </div>
              <div className="setting-card">
                <div className="setting-icon"><i className="fas fa-bell"></i></div>
                <div className="setting-info">
                  <h4>الإشعارات</h4>
                  <p>إدارة تنبيهات التطبيق</p>
                </div>
              </div>
              <div className="setting-card">
                <div className="setting-icon"><i className="fas fa-lock"></i></div>
                <div className="setting-info">
                  <h4>الأمان</h4>
                  <p>كلمة المرور والحماية</p>
                </div>
              </div>
              <div className="setting-card">
                <div className="setting-icon"><i className="fas fa-palette"></i></div>
                <div className="setting-info">
                  <h4>المظهر</h4>
                  <p>تخصيص الألوان والثيم</p>
                </div>
              </div>
            </div>
          </>
        );
      
      default: // home
        return (
          <>
            <div className="welcome-section-3d">
              <div className="welcome-text animated-welcome">
                <h3 className="mockup-hero-title">
                  منصة واحدة لكل <span className="mockup-animated-word">{displayText}<span className="typing-cursor">|</span></span>
                </h3>
                <p>أدر منصتك التعليمية وارفع إنتاجية معلميك وتعاون بشكل أفضل لتحقيق أهداف التعليم المشتركة.</p>
                <div className="mockup-buttons">
                  <Link href="/login" className="mockup-btn mockup-btn-primary">
                    <i className="fas fa-sign-in-alt"></i>
                    <span>تسجيل الدخول</span>
                  </Link>
                  <a 
                    href={whatsappNumber 
                      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، أنا مدرس جديد وأريد الانضمام للمنصة')}`
                      : '#'
                    }
                    onClick={(e) => {
                      if (!whatsappNumber) {
                        e.preventDefault();
                        alert('رقم التواصل غير متاح حالياً، يرجى المحاولة لاحقاً');
                      }
                    }}
                    target={whatsappNumber ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="mockup-btn mockup-btn-whatsapp"
                  >
                    <i className="fab fa-whatsapp"></i>
                    <span>مدرس جديد</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="stats-row-3d">
              <div className="stat-card-3d purple">
                <div className="stat-icon-3d"><i className="fas fa-users"></i></div>
                <div className="stat-number-3d">١٥٠+</div>
                <div className="stat-label-3d">طالب</div>
              </div>
              <div className="stat-card-3d blue">
                <div className="stat-icon-3d"><i className="fas fa-book"></i></div>
                <div className="stat-number-3d">٢٤</div>
                <div className="stat-label-3d">محاضرة</div>
              </div>
              <div className="stat-card-3d green">
                <div className="stat-icon-3d"><i className="fas fa-tasks"></i></div>
                <div className="stat-number-3d">١٢</div>
                <div className="stat-label-3d">واجب</div>
              </div>
            </div>
            <div className="table-section-3d">
              <div className="table-header-row">
                <span className="col-name">الاسم</span>
                <span className="col-status">الحالة</span>
                <span className="col-progress">التقدم</span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">أحمد محمد</span>
                <span className="col-status"><span className="status-badge active">نشط</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill" style={{width: '85%'}}></div></div></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">سارة علي</span>
                <span className="col-status"><span className="status-badge active">نشط</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill" style={{width: '92%'}}></div></div></span>
              </div>
              <div className="table-row-3d">
                <span className="col-name">محمد أحمد</span>
                <span className="col-status"><span className="status-badge pending">معلق</span></span>
                <span className="col-progress"><div className="progress-track"><div className="progress-fill orange" style={{width: '60%'}}></div></div></span>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <section className="landing-hero">
      {/* Enhanced 3D App Mockup */}
      <div className="hero-mockup-3d">
        <div className="mockup-glow"></div>
        <div className="mockup-window-3d">
          {/* Window Header */}
          <div className="mockup-header-3d">
            <div className="mockup-dots-3d">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="mockup-title-3d">
              <img src="/logo.png" alt="Logo" className="mockup-logo" />
            </div>
            <div className="mockup-header-spacer"></div>
          </div>
          
          {/* Window Content */}
          <div className="mockup-body-3d">
            {/* Magic Wand Overlay */}
            {showMagic && (
              <div className="magic-overlay">
                <div className="magic-wand">
                  <i className="fas fa-magic"></i>
                  <div className="sparkles">
                    <span className="sparkle"></span>
                    <span className="sparkle"></span>
                    <span className="sparkle"></span>
                    <span className="sparkle"></span>
                    <span className="sparkle"></span>
                    <span className="sparkle"></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mobile Hamburger Menu */}
            <div className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <div className="hamburger-icon">
                <span className={mobileMenuOpen ? 'open' : ''}></span>
                <span className={mobileMenuOpen ? 'open' : ''}></span>
                <span className={mobileMenuOpen ? 'open' : ''}></span>
              </div>
              <span className="current-page-label">{getPageLabel(activePage)}</span>
              <i className={`fas fa-chevron-down ${mobileMenuOpen ? 'rotate' : ''}`}></i>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`mobile-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
              <div 
                className={`mobile-menu-item ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => handlePageChange('home')}
              >
                <i className="fas fa-home"></i>
                <span>الرئيسية</span>
              </div>
              <div 
                className={`mobile-menu-item ${activePage === 'students' ? 'active' : ''}`}
                onClick={() => handlePageChange('students')}
              >
                <i className="fas fa-user-graduate"></i>
                <span>الطلاب</span>
              </div>
              <div 
                className={`mobile-menu-item ${activePage === 'lectures' ? 'active' : ''}`}
                onClick={() => handlePageChange('lectures')}
              >
                <i className="fas fa-book-open"></i>
                <span>المحاضرات</span>
              </div>
              <div 
                className={`mobile-menu-item ${activePage === 'exams' ? 'active' : ''}`}
                onClick={() => handlePageChange('exams')}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>الامتحانات</span>
              </div>
              <div 
                className={`mobile-menu-item ${activePage === 'reports' ? 'active' : ''}`}
                onClick={() => handlePageChange('reports')}
              >
                <i className="fas fa-chart-pie"></i>
                <span>التقارير</span>
              </div>
              <div 
                className={`mobile-menu-item ${activePage === 'settings' ? 'active' : ''}`}
                onClick={() => handlePageChange('settings')}
              >
                <i className="fas fa-cog"></i>
                <span>الإعدادات</span>
              </div>
            </div>

            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="sidebar-3d desktop-only">
              <div 
                className={`sidebar-item ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => handlePageChange('home')}
              >
                <i className="fas fa-home"></i>
                <span>الرئيسية</span>
              </div>
              <div 
                className={`sidebar-item ${activePage === 'students' ? 'active' : ''}`}
                onClick={() => handlePageChange('students')}
              >
                <i className="fas fa-user-graduate"></i>
                <span>الطلاب</span>
              </div>
              <div 
                className={`sidebar-item ${activePage === 'lectures' ? 'active' : ''}`}
                onClick={() => handlePageChange('lectures')}
              >
                <i className="fas fa-book-open"></i>
                <span>المحاضرات</span>
              </div>
              <div 
                className={`sidebar-item ${activePage === 'exams' ? 'active' : ''}`}
                onClick={() => handlePageChange('exams')}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>الامتحانات</span>
              </div>
              <div 
                className={`sidebar-item ${activePage === 'reports' ? 'active' : ''}`}
                onClick={() => handlePageChange('reports')}
              >
                <i className="fas fa-chart-pie"></i>
                <span>التقارير</span>
              </div>
              <div className="sidebar-divider"></div>
              <div 
                className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`}
                onClick={() => handlePageChange('settings')}
              >
                <i className="fas fa-cog"></i>
                <span>الإعدادات</span>
              </div>
            </div>

            {/* Main Content - Dynamic based on active page */}
            <div className="main-content-3d" key={activePage}>
              {renderMainContent()}
            </div>

            {/* Left Notifications Panel */}
            <div className="notifications-panel-3d">
              <div className="panel-title-3d">
                <i className="fas fa-bell"></i>
                <span>الإشعارات</span>
              </div>
              <div className="notification-list-3d">
                <div className="notif-item-3d">
                  <span className="notif-dot purple"></span>
                  <span>طالب جديد سجل في المحاضرة</span>
                </div>
                <div className="notif-item-3d">
                  <span className="notif-dot blue"></span>
                  <span>تم رفع واجب جديد</span>
                </div>
                <div className="notif-item-3d">
                  <span className="notif-dot green"></span>
                  <span>اكتمل امتحان الوحدة ٣</span>
                </div>
                <div className="notif-item-3d">
                  <span className="notif-dot orange"></span>
                  <span>موعد محاضرة بعد ساعة</span>
                </div>
                <div className="notif-item-3d">
                  <span className="notif-dot purple"></span>
                  <span>٥ طلاب أكملوا الواجب</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
