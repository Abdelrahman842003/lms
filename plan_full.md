# Neetaq LMS – Online Business & Referral System Spec

## Executive Summary (الملخص التنفيذي)
تعتبر منصة "نطاق" (Neetaq) نظام إدارة تعليم متعدد المستأجرين (Multi-tenant LMS) يخدم المدرسين والأكاديميات وفق نموذج عمل B2B. تهدف هذه الوثيقة إلى توصيف الإضافة الجديدة الخاصة بـ **الطلاب الأونلاين (Online Students)**.
تتيح هذه الميزة لأصحاب المحتوى إنشاء خطط دراسية أونلاين، وتسجيل الطلاب عبر الإنترنت باستخدام "أكواد دعوة" (Referral Codes). الدفع يتم حصرياً بالجنيه المصري (EGP) عبر بوابات الدفع الخاصة بالمدرسين/الأكاديميات دون اقتطاع أي عمولات من قبل المنصة. الواجهات تعتمد على Next.js، والـ Backend مبني على Laravel، مع التركيز على الأمان، تشفير البيانات الحساسة، وتقديم تجربة دفع سلسة بالاعتماد الكامل على تقنية الـ Iframe.

---

## Phase 0: System Constraints & Business Logic (الثوابت ومحددات النظام)
- **العملة المدعومة:** الجنيه المصري (EGP) فقط.
- **نموذج الربح:** لا توجد عمولة على عمليات الدفع الأونلاين. اشتراك المدرس/الأكاديمية في منصة Neetaq يعتمد على إجمالي عدد الطلاب (Offline + Online).
- **تعريف الطالب الأونلاين:** مستخدم يسجل عبر الإنترنت باستخدام رقم هاتف صالح وكود دعوة. بمجرد التحقق من الكود، يتم ربطه تلقائياً بالمدرس/الأكاديمية، الصف، المجموعة، والخطة (إن وجدت).

---

## Phase 1: Payment Gateways Foundation (إعداد بوابات الدفع الأساسية)
### Backend
- إنشاء `PaymentGateway` Model/Migration (الاسم، المعرف، Omnipay Driver، حالة التفعيل `is_active`).
- إنشاء `PaymentGatewayCredential` Model/Migration كجدول وسيط (Polymorphic) يربط `owner` (Teacher/Academy) بالبوابة.
- **Security Check:** تطبيق `Encrypted Casts` في Laravel لحقل `credentials` لضمان تشفير الـ API Keys في قاعدة البيانات. يمنع منعاً باتاً إرجاع هذا الحقل في أي API Response.

### Frontend (Admin Panel - Filament)
- إنشاء Resource لإدارة `PaymentGateway` (إضافة/تعديل/تفعيل البوابات على مستوى النظام). لا يتم إدخال الـ Credentials هنا.

---

## Phase 2: Payment Settings (إعدادات الدفع لأصحاب المحتوى)
### Backend
- Endpoints: `GET` و `PUT` على مسارات `/api/v1/teacher/payment-gateways` و `/api/v1/academy/payment-gateways`.
- استخدام Form Requests للتحقق من المدخلات والتأكد من أن البوابة `is_active = true` قبل حفظ مفاتيح التاجر.

### Frontend
- المسارات: `teacher/payment-settings` و `academy/payment-settings`.
- واجهة تتيح للمدرس/الأكاديمية إدخال بيانات الربط (مثل Merchant ID, Secret Key لـ Paymob) وحفظها بأمان عبر الـ API.

---

## Phase 3: Online Plans Management (إدارة الخطط الأونلاين)
### Backend
- إنشاء `OnlineCoursePlan` Model/Migration (السعر الأصلي، السعر بعد الخصم، نوع الاشتراك، حالة التفعيل، المالك، الصف).
- إنشاء عمليات CRUD كاملة عبر APIs مخصصة (Teacher & Academy).
- Endpoints لربط وفك ربط (Attach/Detach) الفيديوهات والامتحانات بالخطة المستهدفة.

### Frontend
- واجهات إدارة متكاملة (Listing, Create, Edit) مع فلاتر بحث (`OnlinePlanCard`, `OnlinePlanForm`, `VideoSelector`).
- التأكد من استخدام Services Layer المحددة (`onlinePlanService.ts`).

---

## Phase 4: Referral Codes System (نظام أكواد الدعوة)
### Backend
- إنشاء `ReferralLink` Model/Migration (`code`, `discount_type`, `discount_value`, `max_uses`, `used_count`, `expires_at`, `is_active`، والربط بـ `plan_id` اختيارياً).
- إنشاء APIs لعمليات الـ CRUD والإحصائيات. التأكد من توليد أكواد فريدة (Unique) بشكل آمن إذا لم يتم إدخالها يدوياً.

### Frontend
- واجهة إدارة للأكواد تعرض حالة كل كود ومدى استهلاكه (`used_count` vs `max_uses`).

---

## Phase 5: Online Student Onboarding (تسجيل الطالب الأونلاين)
### Backend
- Endpoint: `POST /api/v1/register/student`
- **Validation Logic:**
  - التحقق من صيغة رقم الهاتف (11 رقم مصري)، وعدم تكراره.
  - التحقق من قوة كلمة المرور.
  - التحقق من `referral_code` (موجود، يتبع حساب مفعل، لم يتجاوز الحد الأقصى، لم ينتهِ).
- **Execution:**
  - إنشاء الطالب بنوع `online`.
  - ربط الطالب بالمدرس، الصف، والمجموعة تلقائياً.
  - إذا كان الكود مرتبطاً بخطة، يتم إنشاء `StudentOnlineSubscription` بحالة `pending`.
  - إرجاع الـ Auth Token لتسجيل الدخول الفوري.

### Frontend
- بناء صفحة التسجيل (`app/register/page.tsx`) مع `ReferralCodeInput` مخصص ومعالجة دقيقة لرسائل الخطأ للتحقق من الكود قبل الإرسال النهائي (Optional live validation).

---

## Phase 6: Student Experience (تجربة الطالب الأونلاين)
### Backend
- APIs لجلب الخطط المتاحة (Explore) وفقاً للصف الدراسي والمدرس.
- API لجلب تفاصيل الخطة ولوحة تحكم (Dashboard) توضح التقدم في الاشتراكات النشطة.

### Frontend
- تفعيل مسارات `student/explore` و `student/dashboard`.
- التأكد من إظهار المحتوى (فيديوهات/امتحانات) فقط للخطط ذات الحالة `active` (Active Subscriptions).

---

## Phase 7: Checkout & Payments Integration (الدفع والخروج)
### Backend (Payment Flow & Webhook)
- **Initiate Payment:** `POST /api/v1/student/payments/initiate`. جلب مفاتيح المالك المشفّرة، احتساب السعر النهائي (بعد خصم الكود)، وإنشاء Payment Request عبر Omnipay. يتم إنشاء سجل `StudentPayment` بحالة `pending`.
- **Merchant Branding:** استخدام بيانات المدرس/الأكاديمية لعرض هويتهم كتاجر التحصيل في بوابة الدفع (لا يظهر اسم "Neetaq" كجهة تحصيل).
- **Webhook Handler:** استقبال إشعارات Paymob. التحقق من الـ Signature، تطبيق Idempotency. عند النجاح: تحديث الدفع إلى `success`، تفعيل الاشتراك (`active` مع تواريخ البدء والانتهاء)، وزيادة `used_count` لكود الدعوة.

### Frontend (Strict Iframe Flow)
- بناء Component مخصص `PaymentIframe` يستقبل رابط الدفع ويعرضه داخل `<iframe>`.
- **Security:** إضافة `sandbox` و `allow="payment"` لدعم 3D Secure و OTP داخل الـ Iframe.
- الاعتماد على Webhooks للـ Backend، مع الاستماع لـ `postMessage` أو التعامل مع الـ Return URL داخل الـ Iframe لتحديث الـ UI فور النجاح دون مغادرة المنصة.

---

## Phase 8: Access Control & Middleware (الصلاحيات وسياسات الوصول)
### Backend
- تطبيق `VideoAccessPolicy` / `OnlinePlanPolicy` للتأكد من أحقية الطالب في استهلاك المحتوى (اشتراك ساري المفعول).
- استخدام Middleware `EnsureActiveOnlinePlan` على مسارات استهلاك المحتوى.

### Frontend
- تعديل الـ Sidebar والملاحة عبر `SelectionContext` لعرض القوائم الخاصة بالطالب الأونلاين (مثل "استكشاف الكورسات" و "اشتراكاتي") بشكل ديناميكي.

---

## Phase 9: Security, Rate Limiting & Background Jobs (الأمان والصيانة الآلية)
### Backend
- **Rate Limiting:** تطبيق قيود صارمة على مسارات (التسجيل، التحقق من الأكواد، وبدء الدفع) لمنع الـ Brute-force attacks.
- **Scheduled Task (Garbage Collection):** - إنشاء Laravel Command (مثلاً `subscriptions:cleanup-pending`) يعمل كل ساعة (`hourly`).
  - **Logic:** البحث عن الاشتراكات بحالة `pending` والتي مر عليها أكثر من 48 ساعة. يتم تحويل حالة الدفع إلى `failed` أو `expired`، إلغاء الحجز (Enrollment) من المجموعة لتفريغ المقعد، وعمل Soft/Hard delete للاشتراك المعلق لتنظيف قاعدة البيانات.


  # Neetaq Online Business - Implementation Plan

## Executive Summary

### Overview
This document outlines the implementation plan for adding **Online Business capabilities** to the Neetaq LMS platform. The feature enables Teachers and Academies to offer online courses with self-service student registration, secure online payments, and comprehensive content management.

### Business Model
- **Revenue Model**: Platform earns from SaaS subscriptions based on total student count (offline + online)
- **Payment Flow**: Zero commission on online payments; money goes directly to Teacher/Academy accounts
- **Currency**: Egyptian Pound (EGP) only in Phase 1
- **Payment Gateway**: Paymob initially, extensible to Stripe later

### Key Features
1. **Teacher/Academy Online Plans**: Create course plans with pricing, duration, and video content
2. **Referral System**: Generate invitation codes with optional discounts for student onboarding
3. **Online Student Registration**: Self-service registration using phone number + referral code
4. **Secure Payments**: Omnipay integration with iframe-based checkout
5. **Subscription Management**: Automatic activation, expiry tracking, and access control
6. **Analytics Dashboard**: Performance metrics for plans, referrals, and revenue

### Technical Stack
- **Backend**: Laravel 11.x with domain-driven architecture
- **Frontend**: Next.js 14 with TypeScript
- **Payments**: Omnipay + Paymob (EGP)
- **Database**: MySQL/PostgreSQL with optimized indexes
- **Caching**: Redis for performance
- **Security**: Encrypted credentials, rate limiting, webhook validation

### Timeline
**Total Duration**: 17 weeks (~4 months)

**Estimated Launch**: Week 22 (including staging and gradual rollout)

***

## Implementation Phases

### Phase 0: Foundation & Planning
**Duration**: 1 week  
**Dependencies**: None

#### Objectives
- Establish technical foundations and project structure
- Review existing documentation and identify integration points
- Design database schema for all online business entities
- Define API contracts and integration patterns

#### Deliverables
- ✅ Complete database schema design
- ✅ API contract definitions (OpenAPI spec)
- ✅ Development environment setup with Omnipay sandbox
- ✅ Architecture decision records (ADR)
- ✅ Git branching strategy and PR templates

#### Success Criteria
- All team members have working dev environment
- Schema approved by tech lead and product owner
- API contracts validated with Postman collection
- Zero merge conflicts with existing codebase

***

### Phase 1: Payment Gateways Infrastructure
**Duration**: 2 weeks  
**Dependencies**: Phase 0

#### Objectives
Build the foundational payment gateway abstraction layer that supports multiple providers.

#### Backend Tasks
- [ ] Create `PaymentGateway` model (name, omnipay_driver, is_active)
- [ ] Create `PaymentGatewayCredential` model with polymorphic owner relation
- [ ] Implement encrypted credential storage (Laravel encryption)
- [ ] Build Omnipay service layer with Paymob driver
- [ ] Create admin APIs for gateway management

#### Filament Admin Tasks
- [ ] Payment Gateways Resource (CRUD operations)
- [ ] Gateway activation/deactivation UI
- [ ] Credentials testing interface

#### Database Schema
```sql
payment_gateways:
  - id, name, display_name, omnipay_driver, is_active

payment_gateway_credentials:
  - id, owner_type, owner_id, gateway_id
  - credentials (encrypted JSON)
  - is_active, created_at, updated_at
```

#### Testing
- Unit tests for credential encryption/decryption
- Feature tests for gateway CRUD operations
- Integration test with Paymob sandbox API

#### Success Criteria
- Admin can create and manage payment gateways
- Credentials are encrypted and never exposed in API responses
- Omnipay successfully initializes with test credentials
- Test payment call to Paymob sandbox succeeds

***

### Phase 2: Teacher/Academy Payment Settings
**Duration**: 1.5 weeks  
**Dependencies**: Phase 1

#### Objectives
Allow Teachers and Academies to connect their Paymob accounts for receiving payments.

#### Backend APIs
- [ ] `GET /api/v1/teacher/payment-gateways` - List available gateways
- [ ] `PUT /api/v1/teacher/payment-gateways/{gateway}/credentials` - Save credentials
- [ ] `GET /api/v1/academy/payment-gateways` - List available gateways
- [ ] `PUT /api/v1/academy/payment-gateways/{gateway}/credentials` - Save credentials
- [ ] Credential validation against Paymob API

#### Frontend Pages
- [ ] `teacher/payment-settings/page.tsx`
- [ ] `academy/payment-settings/page.tsx`

#### Components
- [ ] `PaymentSettingsForm.tsx` - Main settings form
- [ ] `PaymentGatewayCard.tsx` - Gateway connection card
- [ ] `CredentialInput.tsx` - Secure input for API keys

#### Services
- [ ] `onlinePaymentService.ts` - Payment settings API calls

#### Testing
- Feature tests for API endpoints with valid/invalid credentials
- Component tests with mocked API responses
- E2E test: Teacher connects Paymob account successfully

#### Success Criteria
- Teacher/Academy can save Paymob API keys securely
- System validates keys by making test API call
- UI shows clear connection status (connected/not configured)
- Error messages guide user when credentials are invalid

***

### Phase 3: Online Plans Management
**Duration**: 2 weeks  
**Dependencies**: Phase 2

#### Objectives
Enable creation and management of online course plans with pricing and content.

#### Backend Tasks
- [ ] Create `OnlineCoursePlan` model
  - Fields: owner (polymorphic), grade_id, title, description, price, original_price, period_type, is_active
- [ ] Teacher online plans CRUD APIs
- [ ] Academy online plans CRUD APIs
- [ ] Video attachment/detachment logic
- [ ] Plan validation rules (price > 0, period valid, etc.)

#### Frontend Pages
- [ ] `teacher/online-plans/page.tsx` - Plans listing with filters
- [ ] `teacher/online-plans/create/page.tsx` - Creation form
- [ ] `teacher/online-plans/[id]/edit/page.tsx` - Edit form
- [ ] Academy equivalents under `/academy/online-plans`

#### Components
- [ ] `OnlinePlanCard.tsx` - Plan display card
- [ ] `OnlinePlanForm.tsx` - Create/edit form
- [ ] `OnlinePlanFilters.tsx` - Search and filter UI
- [ ] `VideoSelector.tsx` - Multi-select for attaching videos

#### Services
- [ ] `onlinePlanService.ts` - Plan CRUD operations

#### Database Schema
```sql
online_course_plans:
  - id, owner_type, owner_id, grade_id
  - title, description
  - price, original_price, currency (default: EGP)
  - period_type (monthly, quarterly, annual, lifetime)
  - is_active, created_at, updated_at

online_course_plan_videos (pivot):
  - plan_id, video_id, order
```

#### Testing
- Unit tests for plan pricing calculations
- Feature tests for plan CRUD operations
- Feature tests for video attachment
- E2E test: Teacher creates plan with 5 videos and publishes it

#### Success Criteria
- Teacher can create plan with title, price, period, and videos
- Plans visible in teacher dashboard with subscriber count
- Price validation prevents negative or zero amounts
- Video selection shows only teacher's own videos

***

### Phase 4: Referral System (Onboarding Codes)
**Duration**: 2 weeks  
**Dependencies**: Phase 3

#### Objectives
Implement secure invitation/referral codes with discount capabilities for student onboarding.

#### Backend Tasks
- [ ] Create `ReferralLink` model
  - Fields: code, owner (polymorphic), plan_id (optional), grade_id, group_id, discount_type, discount_value, max_uses, used_count, expires_at, is_active
- [ ] Create `ReferralUsage` tracking model
- [ ] Build secure code generation service (8-char alphanumeric, no ambiguous chars)
- [ ] Referral validation API
- [ ] Teacher/Academy referral CRUD APIs
- [ ] Usage analytics APIs

#### Frontend Pages
- [ ] `teacher/referrals/page.tsx` - Referral listing with stats
- [ ] `teacher/referrals/create/page.tsx` - Create referral form
- [ ] Academy equivalents

#### Components
- [ ] `ReferralLinkCard.tsx` - Referral display card with QR code
- [ ] `ReferralLinkForm.tsx` - Create/edit form
- [ ] `ReferralStats.tsx` - Analytics dashboard
- [ ] `QRCodeGenerator.tsx` - QR code for easy sharing

#### Services
- [ ] `referralService.ts` - Referral CRUD and analytics

#### Database Schema
```sql
referral_links:
  - id, co 
