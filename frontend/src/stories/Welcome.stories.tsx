/**
 * Welcome to LMS Storybook
 * Introduction page for the component library
 */

export default {
  title: 'Introduction/Welcome',
  parameters: {
    layout: 'fullscreen',
    options: {
      showPanel: false,
    },
  },
};

export const Welcome = () => (
  <div className="p-8 max-w-4xl mx-auto" dir="rtl">
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        📚 مكتبة مكونات نظام إدارة التعلم
      </h1>
      <p className="text-xl text-gray-600">
        مجموعة شاملة من المكونات القابلة لإعادة الاستخدام
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* UI Components Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="text-2xl mb-3">🎨</div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">مكونات واجهة المستخدم</h3>
        <p className="text-blue-700 text-sm">
          أزرار، نماذج، قوائم منسدلة، نوافذ منبثقة ومكونات أساسية أخرى
        </p>
        <div className="mt-3 text-xs text-blue-600">
          Button • Select • Modal • LoadingSpinner
        </div>
      </div>

      {/* Forms Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-2xl mb-3">📝</div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">مكونات النماذج</h3>
        <p className="text-green-700 text-sm">
          نماذج متقدمة للبيانات، التحقق من الصحة، وتحميل الملفات
        </p>
        <div className="mt-3 text-xs text-green-600">
          FormModal • ImageCropModal • AvatarUpload
        </div>
      </div>

      {/* Monitoring Card */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="text-2xl mb-3">📊</div>
        <h3 className="text-lg font-semibold text-purple-900 mb-2">مراقبة الأداء</h3>
        <p className="text-purple-700 text-sm">
          أدوات مراقبة الأداء وتتبع المقاييس في الوقت الفعلي
        </p>
        <div className="mt-3 text-xs text-purple-600">
          PerformanceMonitor • Dashboard
        </div>
      </div>

      {/* Accessibility Card */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-2xl mb-3">♿</div>
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">إمكانية الوصول</h3>
        <p className="text-yellow-700 text-sm">
          جميع المكونات مصممة لدعم قارئات الشاشة والتنقل بالكيبورد
        </p>
        <div className="mt-3 text-xs text-yellow-600">
          ARIA • Keyboard Navigation • Screen Readers
        </div>
      </div>

      {/* RTL Support Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="text-2xl mb-3">🔡</div>
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">دعم اللغة العربية</h3>
        <p className="text-indigo-700 text-sm">
          تصميم من اليمين إلى اليسار مع دعم كامل للنصوص العربية
        </p>
        <div className="mt-3 text-xs text-indigo-600">
          RTL Layout • Arabic Fonts • Direction Control
        </div>
      </div>

      {/* Testing Card */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-2xl mb-3">🧪</div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">اختبارات شاملة</h3>
        <p className="text-red-700 text-sm">
          جميع المكونات مختبرة بـ Jest و Testing Library و Playwright
        </p>
        <div className="mt-3 text-xs text-red-600">
          Unit Tests • Integration Tests • E2E Tests
        </div>
      </div>
    </div>

    {/* Features Section */}
    <div className="bg-gray-50 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">✨ المميزات الرئيسية</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="text-green-500">✅</div>
          <div>
            <h4 className="font-medium text-gray-900">تصميم متجاوب</h4>
            <p className="text-sm text-gray-600">يعمل بشكل مثالي على جميع أحجام الشاشات</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="text-green-500">✅</div>
          <div>
            <h4 className="font-medium text-gray-900">TypeScript</h4>
            <p className="text-sm text-gray-600">مكتوب بالكامل بـ TypeScript للأمان والوضوح</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="text-green-500">✅</div>
          <div>
            <h4 className="font-medium text-gray-900">Tailwind CSS</h4>
            <p className="text-sm text-gray-600">تصميم سريع ومرن مع Tailwind</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="text-green-500">✅</div>
          <div>
            <h4 className="font-medium text-gray-900">Next.js 15</h4>
            <p className="text-sm text-gray-600">أحدث ميزات Next.js مع App Router</p>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Start */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚀 البدء السريع</h2>
      <div className="space-y-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">1</span>
          <span>تصفح المكونات في القائمة الجانبية</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">2</span>
          <span>جرب التحكم في الخصائص من لوحة Controls</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">3</span>
          <span>استخدم أداة Direction في الشريط العلوي للتبديل بين RTL/LTR</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">4</span>
          <span>اقرأ الوثائق المدمجة لكل مكون</span>
        </div>
      </div>
    </div>

    <div className="text-center mt-8 text-gray-500">
      <p>بناه فريق التطوير 💙 مع Next.js و Storybook</p>
    </div>
  </div>
);

export const ComponentOverview = () => (
  <div className="p-8" dir="rtl">
    <h1 className="text-3xl font-bold mb-6">نظرة عامة على المكونات</h1>
    
    <div className="grid gap-6">
      {/* Navigation hint */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="text-blue-400">💡</div>
          </div>
          <div className="mr-3">
            <p className="text-blue-700">
              استخدم القائمة الجانبية للتنقل بين المكونات المختلفة. كل مكون له أمثلة وخصائص قابلة للتحكم.
            </p>
          </div>
        </div>
      </div>

      {/* Components list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">🎯 UI/Button</h3>
          <p className="text-gray-600 text-sm">مكون الزر الأساسي مع أحجام وأنواع مختلفة</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">📋 UI/Select</h3>
          <p className="text-gray-600 text-sm">قائمة منسدلة مع إمكانية البحث</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">🔄 UI/LoadingSpinner</h3>
          <p className="text-gray-600 text-sm">مؤشر تحميل مع أحجام وألوان مختلفة</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">❓ UI/ConfirmationModal</h3>
          <p className="text-gray-600 text-sm">نافذة تأكيد للإجراءات المهمة</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">📊 Monitoring/PerformanceMonitor</h3>
          <p className="text-gray-600 text-sm">مراقب الأداء في الوقت الفعلي</p>
        </div>
      </div>
    </div>
  </div>
);