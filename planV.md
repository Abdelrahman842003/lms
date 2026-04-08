# خطة تنفيذ نظام الكورسات (Phased Roadmap)

## الهدف
تحويل النظام من فيديوهات مستقلة إلى نظام كورسات كامل يدعم:
- مستويات متعددة داخل الكورس
- دروس متنوعة (Video / PDF / Exam)
- ترتيب وتسلسل إلزامي
- تتبع تقدم شامل
- تكامل مع Gamification + Notifications
- أمان قوي بنفس مستوى نظام الفيديوهات الحالي

---

## القرارات المطلوبة قبل التنفيذ (Phase 0 - Alignment)

> هذه المرحلة **إلزامية** قبل بدء التطوير لتجنب إعادة العمل.

### الأسئلة المفتوحة
1. **مكان عرض الكورسات للطالب**
     - الخيار المقترح: صفحة منفصلة ` /student/courses ` + رابط في الـ sidebar.
2. **نظام الدفع**
     - هل الكورسات مجانية ضمن التسجيل؟ أم مدفوعة بسعر منفصل؟
3. **Watermark للـ PDFs**
     - هل مطلوب Watermark ديناميكي (اسم الطالب + الهاتف) لكل صفحة؟
4. **الحدود القصوى**
     - أقصى عدد مستويات/دروس لكل كورس.
5. **ترتيب التنفيذ**
     - الموصى به: Phase-by-Phase كما بالأسفل (وليس Backend كامل مرة واحدة).

### مخرجات Phase 0 (Definition of Ready)
- اعتماد الخيارات الخمسة أعلاه.
- اعتماد ترتيب المراحل والـ acceptance criteria.
- تثبيت أي قيود منتجية (limits/pricing/policy).

---

## Phase 1 — Data Layer (Database + Models)

### الهدف
بناء بنية بيانات الكورسات بالكامل كأساس لجميع المراحل اللاحقة.

### النطاق
#### 1) Migrations جديدة
- `courses`
- `course_group_targets`
- `course_levels`
- `course_lessons`
- `course_access_grants`
- `course_progress`
- `course_lesson_progress`

#### 2) Models جديدة داخل `app/Domains/Courses/Models/`
- `Course`
- `CourseLevel`
- `CourseLesson`
- `CourseGroupTarget`
- `CourseAccessGrant`
- `CourseProgress`
- `CourseLessonProgress`

#### 3) تحديث علاقات موديلات موجودة
- `Teacher` / `Academy`: إضافة `courses()`
- `Student`: إضافة `courseProgresses()`
- `Video` (اختياري): إضافة `belongsTo(CourseLesson)`

### ملاحظات تصميم مهمة
- `Course` polymorphic owner: `independent_teacher | academy`
- `CourseLesson.type`: `video | pdf | exam`
- `content_id` يرتبط بـ `videos.id` أو `exams.id`
- `content_config` للـ PDF/Exam metadata

### شروط الإنهاء (DoD)
- جميع الجداول + العلاقات + الفهارس + القيود متاحة وتعمل.
- Soft deletes مفعلة لـ `courses`.
- integrity checks سليمة (FK/unique/indexes).

---

## Phase 2 — Core Backend Domain + APIs

### الهدف
توفير منطق الكورسات الكامل (CRUD/lifecycle/access/progress) مع API جاهز للواجهات.

### النطاق
#### 1) بنية Domain جديدة `app/Domains/Courses/`
- `DTOs`: `CreateCourseData`, `UpdateCourseData`, `CreateLevelData`, `CreateLessonData`
- `Enums`: `CourseStatus`, `LessonType`, `CourseProgressStatus`, `LessonProgressStatus`
- `Services`:
    - `CourseLifecycleService`
    - `CourseLessonService`
    - `CourseAccessService`
    - `CourseProgressService`
    - `CoursePdfService`
    - `CourseAuthorizationService`
- `Policies`: `CoursePolicy`
- `Resources`: `CourseResource`, `CourseLevelResource`, `CourseLessonResource`
- `Jobs`: `CalculateCourseStats`, `GrantCourseAccessToGroup`, `RecalculateProgress`
- `Events`: `CoursePublished`, `LessonCompleted`, `LevelCompleted`, `CourseCompleted`

#### 2) Routes
- ملف جديد: `routes/api/v1/courses.php`
- تضمينه في `routes/api.php`

#### 3) Dashboard APIs (Teacher/Academy)
- CRUD الكورس
- publish / archive
- إدارة levels/lessons + reorder
- قائمة الطلاب + تقدمهم التفصيلي

#### 4) Student APIs
- الكورسات المتاحة
- تفاصيل الكورس + التقدم
- start/complete lesson
- عرض PDF عبر signed URL
- تقدم الطالب في الكورس

### إعادة استخدام مكونات موجودة
- Video upload/stream/token/access logic
- Exam domain الحالي

### شروط الإنهاء (DoD)
- جميع endpoints متاحة ومغطاة بصلاحيات صحيحة.
- sequential unlocking يعمل بشكل صحيح.
- progress update (lesson/level/course) يعمل بدون تعارض.

---

## Phase 3 — Admin (Filament)

### الهدف
تمكين الإدارة المركزية للكورسات من لوحة الأدمن.

### النطاق
- `app/Filament/Resources/CourseResource.php`
- عرض الكورسات + فلاتر (status/owner/grade)
- صفحة تفاصيل + إحصائيات
- إجراءات: تعليق/أرشفة/حذف
- أعمدة: title, owner, grade, levels, lessons, enrolled students, avg completion, status, created_at

### شروط الإنهاء (DoD)
- الأدمن قادر على رؤية وإدارة الكورسات كاملًا من Filament.
- التقارير الأساسية تظهر بدقة.

---

## Phase 4 — Dashboard Frontend (Teacher/Academy)

### الهدف
تقديم تجربة إنشاء وإدارة كورس كاملة للمدرس/الأكاديمية.

### النطاق
#### Teacher pages
- `frontend/src/app/teacher/courses/page.tsx`
- `frontend/src/app/teacher/courses/create/page.tsx` (wizard)
- `frontend/src/app/teacher/courses/[id]/page.tsx`
- `frontend/src/app/teacher/courses/[id]/edit/page.tsx`
- `frontend/src/app/teacher/courses/[id]/students/page.tsx`

#### Academy pages
- نفس البنية تحت `frontend/src/app/academy/courses/`

#### Wizard steps
1. بيانات أساسية: title, description, grade, targets, thumbnail, is_sequential
2. مستويات ودروس + Drag & Drop + إضافة (Video/PDF/Exam)
3. Review & Publish/Draft

### شروط الإنهاء (DoD)
- إنشاء كورس كامل من الواجهة بدون تدخل يدوي.
- رفع الفيديو/PDF وربط الامتحان يعمل end-to-end.
- ترتيب المستويات/الدروس ينعكس فورًا في backend.

---

## Phase 5 — Student Frontend Experience

### الهدف
عرض الكورسات للطالب مع progress + locking + تشغيل أنواع المحتوى المختلفة.

### النطاق
- `frontend/src/app/student/courses/page.tsx`
- `frontend/src/app/student/courses/[id]/page.tsx`
- UI states: `completed / current / locked`
- تشغيل الفيديو عبر المكوّن الحالي
- عرض PDF (signed URL inline)
- الدخول للامتحان عبر المكوّن الحالي

### قرار معماري مقترح
- اعتماد صفحة منفصلة ` /student/courses ` بدل دمجها في صفحة الفيديوهات.

### شروط الإنهاء (DoD)
- الطالب يرى فقط الكورسات المصرح بها.
- لا يمكن فتح درس مقفول.
- نسبة التقدم ومؤشر الدرس الحالي محدثين بدقة.

---

## Phase 6 — Security Hardening

### الهدف
تأمين محتوى الكورسات (خصوصًا PDF) بنفس مستوى أمن الفيديوهات.

### النطاق
#### Video (reuse)
- direct upload to R2
- playback tokens
- signed URLs
- device fingerprinting
- access grants/logs

#### PDF (new)
- تخزين private bucket فقط
- signed URLs قصيرة العمر (30 دقيقة)
- backend proxy + same-origin iframe
- منع context menu + print UI constraints
- (اختياري حسب القرار) watermark ديناميكي server-side
- access logs مماثلة للفيديو

#### Exam
- التأكد من إكمال المتطلبات قبل المحاولة
- التحقق من `CourseAccessGrant`

### شروط الإنهاء (DoD)
- محاولات الوصول غير المصرح بها تُرفض وتُسجّل.
- لا يوجد public PDF URL دائم.

---

## Phase 7 — Gamification Integration

### الهدف
ربط إنجازات الكورسات بمنظومة النقاط الحالية.

### النطاق
#### تعديل `GamificationSetting.php`
- `course_lesson_complete_points`
- `course_level_complete_bonus`
- `course_complete_bonus`
- `course_streak_3_lessons`
- `course_perfect_exam_bonus`
- `course_fast_complete_bonus`

#### تعديل `PointTransactionType.php`
- `COURSE_LESSON_COMPLETE`
- `COURSE_LEVEL_COMPLETE`
- `COURSE_COMPLETE`
- `COURSE_LESSON_STREAK`
- `COURSE_PERFECT_EXAM`
- `COURSE_FAST_COMPLETE`

#### ملف جديد
- `app/Domains/Gamification/Strategies/CoursePointStrategy.php`

### شروط الإنهاء (DoD)
- نقاط الكورس تُحسب عند events الصحيحة فقط.
- لا يوجد تكرار transactions غير مقصود.

---

## Phase 8 — Notifications Integration

### الهدف
تفعيل دورة إشعارات كاملة مرتبطة بتقدم الكورس.

### النطاق
#### Notifications المطلوبة
- Course published
- Lesson available/completed
- Level completed
- Course completed
- Exam result
- Inactivity reminder
- New points earned

#### قناة الإرسال
- Reverb (in-app realtime)
- FCM (خصوصًا أولياء الأمور)
- Queue لجميع الرسائل

#### التنفيذ
- إعادة استخدام `NotificationService`
- Listeners:
    - `LessonCompleted → SendLessonCompletedNotifications`
    - `LevelCompleted → SendLevelCompletedNotifications`
    - `CourseCompleted → SendCourseCompletedNotifications`
    - `CoursePublished → SendCoursePublishedNotifications`

### شروط الإنهاء (DoD)
- الإشعارات تصل للفئة الصحيحة (طالب/ولي أمر/مدرس).
- لا يوجد إرسال مزدوج للأحداث نفسها.

---

## الاعتماديات بين المراحل
- Phase 0 قبل الجميع.
- Phase 1 أساس إلزامي لـ Phase 2.
- Phase 2 أساس إلزامي لـ Phases 3/4/5.
- Phase 6 يعتمد على Phase 2 + Phase 5.
- Phase 7 و Phase 8 يعتمدان على events/progress من Phase 2.

---

## استراتيجية الاختبار والتحقق

### Automated
- Unit Tests:
    - `CourseLifecycleService`
    - `CourseProgressService`
    - `CourseAccessService`
- Feature Tests:
    - Course APIs CRUD + access control + sequencing
- Regression Tests:
    - Video upload/access
    - Student video access
    - Gamification edge cases

### Manual
- Filament Admin: ظهور وإدارة الكورسات
- Teacher Dashboard: إنشاء كورس (Video + PDF + Exam)
- Student View: القفل/التقدم/الوصول
- Security: محاولة وصول PDF بدون صلاحية
- Notifications: تحقق من السيناريوهات الأساسية
- Gamification: صحة النقاط

---

## التنفيذ المقترح (Sprint Order)
1. Sprint A: Phase 0 + Phase 1
2. Sprint B: Phase 2
3. Sprint C: Phase 3 + Phase 4
4. Sprint D: Phase 5 + Phase 6
5. Sprint E: Phase 7 + Phase 8

> كل Sprint ينتهي بـ: Demo + Test pass + Sign-off قبل الانتقال للمرحلة التالية.
