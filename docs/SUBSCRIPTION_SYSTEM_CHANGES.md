# توثيق تعديلات نظام الاشتراكات

## نظرة عامة
تم إجراء تعديلات شاملة على نظام الاشتراكات لعرض "السعر المدفوع للمنصة" بشكل صحيح في صفحة الاشتراكات.

## المشاكل التي تم حلها

### 1. عرض أعمدة خاطئة في جدول الاشتراكات
**المشكلة:** كان يتم عرض "التكلفة التقديرية" و "المبلغ المدفوع" بدلاً من "السعر المدفوع للمنصة"

**الحل:**
- تم حذف العمودين القديمين
- تم إضافة عمود جديد "السعر المدفوع للمنصة" يعرض `subscription_fee`

**الملفات المعدلة:**
- `frontend/src/components/admin/subscriptions/SubscriptionTableColumns.tsx`

### 2. حساب السعر الإجمالي للباقة
**المشكلة:** لم يكن هناك حساب تلقائي للسعر الإجمالي عند تفعيل الباقة

**الحل:**
تم تعديل `setSubscriptionPlan` لحساب السعر تلقائياً:
```
السعر الإجمالي = عدد الطلاب × عدد الشهور × سعر الطالب
```

**الملفات المعدلة:**
- `backend/app/Services/Admin/AcademyService.php`
- `backend/app/Services/Admin/TeacherService.php`

### 3. عدم تطابق مفاتيح الإعدادات
**المشكلة:** الباك إند يرسل `academy_student_price` (snake_case) لكن الفرونت إند يتوقع `academyStudentPrice` (camelCase)

**الحل:**
تم إضافة تحويل تلقائي للمفاتيح في `getPublicSettings`

**الملف المعدل:**
- `backend/app/Services/Admin/SettingsService.php`

### 4. إعادة حساب الباقات القديمة
**المشكلة:** الباقات الموجودة كانت تحتوي على أسعار خاطئة

**الحل:**
تم إنشاء أمر Artisan لإعادة حساب جميع الباقات

**الملف المُنشأ:**
- `backend/app/Console/Commands/RecalculateSubscriptionFees.php`

**الاستخدام:**
```bash
docker exec lms_octane php artisan subscriptions:recalculate-fees
```

## الأسعار الحالية

### المدرسين
- **السعر:** 60 ج.م للطالب/الشهر
- **المفتاح في الإعدادات:** `pricePerStudent`

### الأكاديميات
- **السعر:** 40 ج.م للطالب/الشهر
- **المفتاح في الإعدادات:** `academy_student_price`

## أمثلة على الحساب

### مثال 1: مدرس
- عدد الطلاب: 50
- المدة: 6 أشهر
- السعر: 60 ج.م
- **الإجمالي:** 50 × 6 × 60 = **18,000 ج.م**

### مثال 2: أكاديمية
- عدد الطلاب: 50
- المدة: 12 شهر
- السعر: 40 ج.م
- **الإجمالي:** 50 × 12 × 40 = **24,000 ج.م**

## البيانات المخزنة

### جدول Teachers / Academies
| الحقل | الوصف |
|-------|-------|
| `plan_type` | نوع الباقة (trial/term/custom) |
| `plan_max_students` | الحد الأقصى للطلاب |
| `plan_expires_at` | تاريخ انتهاء الباقة |
| `subscription_fee` | السعر الإجمالي للباقة |
| `paid_amount` | المبلغ المدفوع |
| `is_unlimited_students` | هل الباقة غير محدودة؟ |

## الملفات التي تم تعديلها

### Backend
1. `backend/app/Services/Admin/SubscriptionService.php`
   - تعديل `getAggregatedSubscriptions` لإرجاع `subscription_fee`

2. `backend/app/Services/Admin/AcademyService.php`
   - تعديل `setSubscriptionPlan` لحساب السعر تلقائياً

3. `backend/app/Services/Admin/TeacherService.php`
   - تعديل `setSubscriptionPlan` لحساب السعر تلقائياً

4. `backend/app/Services/Admin/SettingsService.php`
   - إضافة تحويل snake_case إلى camelCase

### Frontend
1. `frontend/src/components/admin/subscriptions/SubscriptionTableColumns.tsx`
   - إضافة عمود "السعر المدفوع للمنصة"
   - تحديث واجهة Subscription

### Commands
1. `backend/app/Console/Commands/RecalculateSubscriptionFees.php`
   - أمر لإعادة حساب جميع الباقات

## ملاحظات مهمة

### الباقات التجريبية (Trial)
- السعر = 0 ج.م
- لا يتم احتساب تكلفة للباقات التجريبية

### الباقات غير المحدودة (Unlimited)
- يتم تخطيها في عملية إعادة الحساب
- `subscription_fee` يظل كما هو

### حساب عدد الشهور
```php
$durationMonths = ceil($planStartsAt->diffInDays($planExpiresAt) / 30);
```

## الأوامر المفيدة

### إعادة حساب جميع الباقات
```bash
docker exec lms_octane php artisan subscriptions:recalculate-fees
```

### تعديل سعر الأكاديميات
```bash
docker exec lms_octane php artisan tinker --execute='
$setting = \App\Models\Setting::where("key", "academy_student_price")->first();
$setting->value = "40";
$setting->save();
'
```

### تعديل سعر المدرسين
```bash
docker exec lms_octane php artisan tinker --execute='
$setting = \App\Models\Setting::where("key", "pricePerStudent")->first();
$setting->value = "60";
$setting->save();
'
```

## إعادة تشغيل الخادم
بعد أي تعديل في الباك إند:
```bash
docker restart lms_octane
```

---
**تاريخ الإنشاء:** 2024
**الإصدار:** 1.0
