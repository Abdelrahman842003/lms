تمام، إليك الخطة المعدّلة والمرتبة بناءً على قرارك إن `ApiResponseTrait.php` هو الأساسي:

***

# 🗂️ خطة العمل الكاملة — Backend LMS

***

## 🔴 المرحلة الأولى — أمان عاجل (افعلها دلوقتي)

| # | المهمة | الملف |
|---|---|---|
| 1 | حذف `cookie.txt` من root الـ repo + إضافته لـ `.gitignore` | `/cookie.txt` |
| 2 | حذف ملفات الـ debug كلها | `debug_group.php`, `debug_list_groups.php`, `debug_student.php`, `test_resources.php` |
| 3 | حذف `composer.lock.backup` | `/composer.lock.backup` |
| 4 | حذف debug SQL log من production | `AcademyGroupService::getGroups()` |

***

## 🔴 المرحلة الثانية — Bugs حقيقية (تكسر التطبيق)

| # | المهمة | الملف |
|---|---|---|
| 5 | إصلاح Race Condition في `generatePaymentKey()` + إضافة `unique index` على `payment_key` | `Subscription.php` |
| 6 | إصلاح `StudentPoint::transactions()` — Relationship بتتقيّم بدري | `StudentPoint.php` |
| 7 | تفعيل `EnsureActiveSubscription` middleware على الـ routes المطلوبة | `api.php` |
| 8 | إصلاح `hasActiveSubscription()` — الـ `if (plan_type === 'trial')` لا تأثير له + استخراجها لـ Trait مشترك | `Teacher.php` + `Academy.php` |
| 9 | إضافة `teacher_id` و `is_active` لـ `$fillable` في Student | `Student.php` |
| 10 | إصلاح `Grade` model — تعارض Manual UUID مع `HasUuids` trait | `AcademyGradeService.php` |

***

## 🟠 المرحلة الثالثة — توحيد الـ API Response

| # | المهمة | الملف |
|---|---|---|
| 11 | تطوير `ApiResponseTrait.php` بإضافة كل الـ methods الناقصة: `created()`, `unauthorized()`, `forbidden()`, `notFound()`, `validationError()`, `tooManyRequests()`, `paginated()`, `noContent()` + استبدال الأرقام بـ `Response::HTTP_*` | `ApiResponseTrait.php` |
| 12 | البحث عن كل الـ controllers اللي بتستخدم `use ApiResponse` وتحويلها لـ `use ApiResponseTrait` | كل الـ Controllers |
| 13 | حذف `ApiResponse.php` نهائياً | `ApiResponse.php` |

***

## 🟠 المرحلة الرابعة — مشاكل الأداء الخطيرة

| # | المهمة | الملف |
|---|---|---|
| 14 | إزالة `total_enrollments_count` من `$appends` في Academy — يتحسب بس لما يتطلب صريح | `Academy.php` |
| 15 | إزالة `['status', 'days_left', 'trial_ends_at']` من `$appends` في Enrollment | `Enrollment.php` |
| 16 | إصلاح `AcademyGradeService::getGrades()` — استبدال PHP `groupBy` بـ MySQL `GROUP BY` | `AcademyGradeService.php` |
| 17 | إصلاح `Lecture::scopeForAcademyTeachers()` — استبدال double `whereHas` بـ `join` مباشر | `Lecture.php` |
| 18 | إصلاح `bulkUpdateName` و `bulkDelete` — استبدال nested `whereHas` بـ `join` | `AcademyGradeService.php` |
| 19 | إضافة `with(['academy:id,trial_period_days', 'teacher:id,trial_period_days'])` في كل query تجيب enrollments | Enrollment queries |

***

## 🟡 المرحلة الخامسة — Structure وـ Code Quality

| # | المهمة | الملف |
|---|---|---|
| 20 | إضافة `Notifiable` trait لـ `Academy` | `Academy.php` |
| 21 | تغيير `boot()` لـ `booted()` في Academy | `Academy.php` |
| 22 | إصلاح `Lecture::current_session()` — rename لـ `currentSession()` camelCase | `Lecture.php` |
| 23 | إصلاح `Video::comments()` — فصل الـ constraint لـ `rootComments()` منفصلة | `Video.php` |
| 24 | إضافة `lesson()` relationship لـ `Video` أو حذف `lesson_id` من `$fillable` | `Video.php` |
| 25 | إصلاح `Lecture::scopeFilter()` — إضافة `default` case في الـ switch | `Lecture.php` |
| 26 | دمج الثلاث Middleware المكررة في middleware واحد يقبل parameter | `Middleware/` |
| 27 | حذف route `/device-tokens` المكرر | `api.php` |
| 28 | حذف أو توحيد `TeacherSubscription` و `AcademySubscription` القديمة | `Subscriptions/Models/` |
| 29 | نقل Trial Period Logic من `Enrollment` model لـ `EnrollmentStatusService` | `Enrollment.php` |
| 30 | توحيد `DeviceToken` + `ParentDeviceToken` في model واحد بـ polymorphic | `Auth/Models/` |

***

## 🔵 المرحلة السادسة — Performance Optimization

| # | المهمة | الملف |
|---|---|---|
| 31 | إضافة `Cache::remember()` لـ `Setting::getValue()` بـ TTL 5 دقائق | `Setting.php` |
| 32 | إضافة Cache لـ `GamificationSetting` بـ TTL ساعة | `GamificationSetting.php` |
| 33 | إضافة Cache لـ `ExamAttempt::getCurrentQuestion()` | `ExamAttempt.php` |
| 34 | إضافة Eager Loading للـ Video queries على `owner`, `uploader`, `publishedBy` | Video queries |
| 35 | إضافة Redis caching لـ Dashboard stats و Grade listings | Services |

***

## ⚪ المرحلة السابعة — Code Style

| # | المهمة | الملف |
|---|---|---|
| 36 | توحيد `$casts` syntax — كل الـ models تستخدم `protected function casts(): array {}` | كل الـ Models |
| 37 | إضافة Return Types لكل الـ Relationships في كل الـ models | كل الـ Models |
| 38 | تقسيم `api.php` إلى ملفات منفصلة per domain | `routes/api/` |
| 39 | إضافة `ExamAttempt::getAnsweredQuestionsCount()` كـ `loadCount` بدل query | `ExamAttempt.php` |

***

## 📚 المرحلة الثامنة — Documentation

| الملف | المحتوى |
|---|---|
| `ARCHITECTURE.md` | شرح Domain-Driven Design structure |
| `API_CONVENTIONS.md` | الـ trait المستخدم (`ApiResponseTrait`) + format الـ responses |
| `CACHING_STRATEGY.md` | أي بيانات بتتكاش وعلى أي key pattern |
| `PERFORMANCE.md` | الـ indexes، الـ queries الثقيلة، الـ jobs |
| `CHANGELOG.md` | tracking التغييرات |

***

## 📊 ملخص

| المرحلة | المهام | الأولوية |
|---|---|---|
| 🔴 أمان عاجل | 4 مهام | افعلها دلوقتي |
| 🔴 Bugs حقيقية | 6 مهام | قبل أي deploy |
| 🟠 API Response توحيد | 3 مهام | مهم جداً |
| 🟠 أداء خطير | 6 مهام | مهم |
| 🟡 Structure | 11 مهمة | متوسط |
| 🔵 Optimization | 5 مهام | بعد الاستقرار |
| ⚪ Code Style | 4 مهام | منخفض |
| 📚 Docs | 5 ملفات | أخر حاجة |