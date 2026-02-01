# نظام إدارة التعلم - Frontend Documentation

## 📋 فهرس المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [بنية المشروع](#بنية-المشروع)
3. [الميزات الأساسية](#الميزات-الأساسية)
4. [الأمان](#الأمان)
5. [الأداء](#الأداء)
6. [التطوير](#التطوير)
7. [الاختبارات](#الاختبارات)
8. [النشر](#النشر)

## 🎯 نظرة عامة

نظام إدارة التعلم (LMS) مبني باستخدام Next.js 14 مع TypeScript، مصمم خصيصاً للبيئة العربية مع دعم كامل للـ RTL والخطوط العربية.

### التقنيات المستخدمة

- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Authentication**: JWT + Refresh Token
- **Testing**: Jest + Playwright + Storybook
- **Performance**: React.memo + Lazy Loading + Bundle Optimization

## 🏗️ بنية المشروع

```
src/
├── app/                    # Next.js App Router
├── components/             # مكونات React قابلة لإعادة الاستخدام
│   ├── ui/                # مكونات UI الأساسية
│   ├── forms/             # مكونات النماذج
│   ├── layout/            # مكونات التخطيط
│   └── performance/       # مكونات محسنة للأداء
├── contexts/              # React Contexts
│   ├── CoreAuthContext/   # المصادقة الأساسية
│   ├── SelectionContext/ # اختيار المعلم/الطفل
│   └── EnhancedAuthContext/ # مزج المصادقة مع الاختيار
├── hooks/                 # Custom React Hooks
│   ├── useAuth/          # hooks المصادقة
│   ├── useApiState/      # حالة API
│   ├── useForm/          # إدارة النماذج
│   ├── useUI/            # تحسين UX
│   └── usePerformance/   # مراقبة الأداء
├── lib/                   # مكتبات مساعدة
│   ├── security/         # أدوات الأمان
│   ├── api/              # عملاء API
│   └── utils/            # أدوات مساعدة
├── services/             # خدمات API
├── middleware.ts         # حماية Routes
└── config/               # ملفات التكوين
    ├── api-config/       # تكوين API موحد
    └── performance/      # تحسينات الأداء
```

## ⭐ الميزات الأساسية

### 1. المصادقة المتقدمة
- **JWT Tokens** مع Refresh Token
- **Multi-role Authentication** (معلم، ولي أمر، إدارة)
- **Session Management** متقدم
- **Route Protection** تلقائي

### 2. إدارة الحالة الذكية
- **Context Splitting**: تقسيم AuthContext لتحسين الأداء
- **Custom Hooks**: hooks متخصصة لكل وظيفة
- **Optimistic Updates**: تحديثات فورية للـ UI
- **Smart Caching**: تخزين مؤقت ذكي

### 3. دعم كامل للعربية
- **RTL Support**: اتجاه من اليمين لليسار
- **Arabic Fonts**: خط Cairo محسن
- **Localization**: ترجمة كاملة
- **Date/Time**: تنسيق التاريخ العربي

### 4. تجربة مستخدم متقدمة
- **Responsive Design**: تصميم متجاوب
- **Loading States**: حالات التحميل الذكية
- **Error Boundaries**: معالجة الأخطاء
- **Accessibility**: إمكانية الوصول

## 🔒 الأمان

### طبقة الأمان المتقدمة

```typescript
// تشفير البيانات الحساسة
import { encryptData, decryptData } from '@/lib/security';

const sensitiveData = await encryptData(userData);
const decryptedData = await decryptData(sensitiveData);
```

### حماية XSS
```typescript
// تنظيف المدخلات
import { sanitizeInput } from '@/lib/security';

const cleanInput = sanitizeInput(userInput);
```

### إدارة الجلسات الآمنة
```typescript
// تخزين آمن للـ tokens
import { secureStorage } from '@/lib/security';

secureStorage.setItem('accessToken', token);
```

### Rate Limiting
```typescript
// تحديد معدل الطلبات
import { RateLimiter } from '@/lib/security';

const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
```

## ⚡ الأداء

### تحسينات React
```typescript
// مكونات محسنة بـ React.memo
import { MemoizedComponent } from '@/components/performance/OptimizedComponents';

// Lazy Loading للـ routes
const LazyDashboard = lazy(() => import('@/app/dashboard/page'));
```

### تتبع الأداء
```typescript
// مراقبة Core Web Vitals
import { usePerformanceMonitoring } from '@/hooks/usePerformance';

const { vitals, memoryUsage } = usePerformanceMonitoring();
```

### تحسين الحزم
- **Code Splitting** تلقائي
- **Bundle Analysis** مع تقارير مفصلة
- **Asset Optimization** للصور والخطوط
- **Caching Strategies** متقدمة

## 👨‍💻 التطوير

### تشغيل المشروع محلياً

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم المحلي
npm run dev

# فحص الكود
npm run lint

# فحص TypeScript
npm run type-check
```

### Custom Hooks المتاحة

#### useAuth
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, login, logout, hasPermission } = useAuth();
```

#### useApiState
```typescript
import { useApiState } from '@/hooks/useApiState';

const { data, loading, error, refetch } = useApiState('/api/students');
```

#### useForm
```typescript
import { useForm } from '@/hooks/useForm';

const { values, errors, handleSubmit } = useForm({
  initialValues: { name: '', email: '' },
  validationSchema: schema,
});
```

### مكونات UI الأساسية

```typescript
// أزرار محسنة
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="lg">
  حفظ التغييرات
</Button>

// نماذج متجاوبة
import { Form, Input } from '@/components/forms';

<Form onSubmit={handleSubmit}>
  <Input label="الاسم" name="name" required />
</Form>
```

## 🧪 الاختبارات

### Unit Tests مع Jest

```bash
# تشغيل الاختبارات
npm run test

# تشغيل مع مراقبة التغييرات
npm run test:watch

# تقرير التغطية
npm run test:coverage
```

### مثال اختبار:
```typescript
import { render, screen } from '@/lib/testing-utils';
import { LoginForm } from '@/components/auth/LoginForm';

test('يجب عرض نموذج تسجيل الدخول', () => {
  render(<LoginForm />);
  
  expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
  expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
});
```

### E2E Testing مع Playwright

```bash
# تشغيل اختبارات E2E
npm run test:e2e

# تشغيل في وضع التطوير
npx playwright test --ui
```

### Storybook للمكونات

```bash
# تشغيل Storybook
npm run storybook

# بناء Storybook
npm run build-storybook
```

## 🚀 النشر

### متغيرات البيئة المطلوبة

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_ENV=production
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourapp.com
```

### بناء المشروع

```bash
# بناء للإنتاج
npm run build

# تشغيل الإنتاج محلياً
npm run start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 مراقبة الأداء

### Core Web Vitals
- **FCP**: First Contentful Paint < 1.8s
- **LCP**: Largest Contentful Paint < 2.5s
- **CLS**: Cumulative Layout Shift < 0.1
- **FID**: First Input Delay < 100ms

### Bundle Analysis
```bash
# تحليل حجم الحزم
npm run analyze

# تقرير مفصل للـ dependencies
npm run bundle-analyzer
```

## 🔧 التحسينات المستقبلية

### المخطط لها
- [ ] PWA Support للعمل بدون إنترنت
- [ ] Real-time Notifications مع WebSocket
- [ ] Advanced Analytics Dashboard
- [ ] Multi-tenant Architecture
- [ ] AI-powered Features

### تحسينات الأداء
- [ ] Server Components optimization
- [ ] Edge Runtime implementation
- [ ] Image optimization with Next.js 14
- [ ] Advanced caching strategies

## 📝 مساهمة في المشروع

### دليل المساهمة
1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

### معايير الكود
- استخدام TypeScript دائماً
- اتباع ESLint rules
- كتابة اختبارات للميزات الجديدة
- توثيق المكونات في Storybook
- دعم RTL في جميع المكونات

## 📞 الدعم الفني

للاستفسارات والدعم الفني:
- **Documentation**: [docs.example.com](https://docs.example.com)
- **GitHub Issues**: [github.com/project/issues](https://github.com/project/issues)
- **Email**: support@example.com

---

**تم تطوير هذا المشروع بحب ❤️ للمجتمع العربي**