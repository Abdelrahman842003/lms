
less than a minute ago

Review

Proceed
نظام الكورسات / السلاسل التعليمية (Course System)
المشكلة الحالية
النظام الحالي يسمح بـ رفع فيديوهات مستقلة فقط (فيديو واحد في كل مرة). المطلوب إضافة نظام كورسات كاملة تحتوي على:

مستويات متعددة (Levels/Sections)
محتوى متنوع داخل كل مستوى: فيديوهات + PDFs + اختبارات
ترتيب المحتوى (1. فيديو → 2. فيديو → 3. PDF → 4. فيديو → 5. امتحان)
تتبع تقدم الطالب الشامل في الكورس
ربط كامل مع أنظمة Gamification والإشعارات
IMPORTANT

هذا البلان شامل جداً ومقسم لـ 8 مراحل. التنفيذ سيكون مرحلة مرحلة بالترتيب. كل مرحلة تعتمد على اللي قبلها.

١. البنية التحتية - Database & Models (Courses Domain)
١.١ الجداول الجديدة (Migration)
[NEW] create_courses_system_tables.php
courses
├── id (uuid, primary)
├── owner_type (string: 'independent_teacher' | 'academy') — نفس VideoOwnerType
├── owner_id (uuid) — polymorphic
├── teacher_reference_id (uuid, FK → teachers, nullable)
├── teacher_reference_name (string, nullable) 
├── academy_id (uuid, FK → academies, nullable)
├── grade_id (uuid, FK → grades)
├── title (string)
├── description (text, nullable)
├── thumbnail_path (string, nullable) — صورة غلاف الكورس
├── status (string: 'draft' | 'published' | 'archived') — default 'draft'
├── is_sequential (boolean, default true) — لازم يخلص الدرس اللي قبله
├── published_at (timestamp, nullable)
├── available_from (timestamp, nullable)
├── available_until (timestamp, nullable)
├── total_duration_seconds (integer, default 0) — يتحسب تلقائي
├── total_lessons (integer, default 0) — يتحسب تلقائي
├── created_at / updated_at / deleted_at (soft deletes)
└── indexes: [owner_type, owner_id] | [grade_id, status] | [academy_id, status]
course_group_targets  — تخصيص الكورس لمجموعات معينة (زي video_group_targets)
├── id (uuid, primary)
├── course_id (uuid, FK → courses, cascade)
├── group_id (uuid, FK → groups, cascade)
├── timestamps
└── unique: [course_id, group_id]
course_levels  — المستويات / الأقسام داخل الكورس
├── id (uuid, primary)
├── course_id (uuid, FK → courses, cascade)
├── title (string) — مثلاً "الفصل الأول"
├── description (text, nullable)
├── sort_order (integer) — ترتيب المستوى
├── is_locked (boolean, default false) — مقفول لحد ما يخلص اللي قبله
├── created_at / updated_at
└── indexes: [course_id, sort_order]
course_lessons  — الدروس داخل كل مستوى (فيديو / PDF / امتحان)
├── id (uuid, primary)
├── course_id (uuid, FK → courses, cascade)
├── level_id (uuid, FK → course_levels, cascade)
├── title (string)
├── description (text, nullable)
├── type (string: 'video' | 'pdf' | 'exam') — نوع المحتوى
├── sort_order (integer) — ترتيب الدرس جوا المستوى
├── is_required (boolean, default true) — لازم يكمله عشان يفتح اللي بعده
├── is_free_preview (boolean, default false) — متاح مجاناً كـ preview
├── content_id (uuid, nullable) — يشاور على video_id أو exam_id
├── content_config (json, nullable) — إعدادات إضافية حسب النوع
│   ├── لو video: {} (الفيديو هيتم إنشاءه وربطه)
│   ├── لو pdf: { "file_path": "...", "file_name": "...", "file_size": ..., "mime_type": "..." }
│   └── لو exam: { "passing_score": 70, "max_attempts": 3 }
├── duration_seconds (integer, nullable) — مدة الفيديو أو وقت الامتحان
├── created_at / updated_at
└── indexes: [level_id, sort_order] | [course_id, type]
course_access_grants  — صلاحيات وصول الطلاب للكورس (زي video_access_grants)
├── id (uuid, primary)
├── course_id (uuid, FK → courses, cascade)
├── student_id (uuid, FK → students, cascade)
├── teacher_id (uuid, FK → teachers, nullable)
├── enrollment_id (uuid, FK → enrollments, nullable)
├── granted_group_id (uuid, FK → groups, nullable)
├── granted_at (timestamp)
├── revoked_at (timestamp, nullable)
├── revoked_reason (string, nullable)
├── eligibility_snapshot (json, nullable)
├── created_at / updated_at
└── unique: [course_id, student_id]
course_progress  — تقدم الطالب في الكورس ككل
├── id (uuid, primary)
├── course_id (uuid, FK → courses, cascade)
├── student_id (uuid, FK → students, cascade)
├── status (string: 'not_started' | 'in_progress' | 'completed')
├── started_at (timestamp, nullable)
├── completed_at (timestamp, nullable)
├── last_activity_at (timestamp, nullable)
├── completed_lessons (integer, default 0)
├── total_lessons (integer) — عدد الدروس وقت التسجيل
├── completion_percentage (decimal 5,2, default 0)
├── current_level_id (uuid, nullable) — المستوى الحالي
├── current_lesson_id (uuid, nullable) — الدرس الحالي
├── created_at / updated_at
└── unique: [course_id, student_id]
course_lesson_progress  — تقدم الطالب في كل درس
├── id (uuid, primary)
├── course_id (uuid, FK → courses, cascade)
├── lesson_id (uuid, FK → course_lessons, cascade)
├── student_id (uuid, FK → students, cascade)
├── status (string: 'locked' | 'available' | 'in_progress' | 'completed')
├── started_at (timestamp, nullable)
├── completed_at (timestamp, nullable)
├── score (decimal 5,2, nullable) — درجة الامتحان لو النوع exam
├── attempts (integer, default 0) — عدد المحاولات لو exam
├── time_spent_seconds (integer, default 0)
├── created_at / updated_at
└── unique: [lesson_id, student_id]
١.٢ النماذج (Models)
جميعها داخل app/Domains/Courses/Models/:

Model	الوصف
Course	الكورس الرئيسي - polymorphic owner (teacher/academy)
CourseLevel	المستوى / القسم داخل الكورس
CourseLesson	الدرس (فيديو / PDF / امتحان)
CourseGroupTarget	ربط الكورس بالمجموعات
CourseAccessGrant	صلاحيات وصول الطالب
CourseProgress	تقدم الطالب الشامل
CourseLessonProgress	تقدم الطالب في كل درس
١.٣ العلاقات المهمة
has many
targets
grants
tracks
has many
tracks
links to (if type=video)
links to (if type=exam)
owned by
owned by
for grade
Course
CourseLevel
CourseGroupTarget
CourseAccessGrant
CourseProgress
CourseLesson
CourseLessonProgress
Video
Exam
Teacher
Academy
Grade
NOTE

لو نوع الدرس video: الفيديو يتم إنشاؤه في جدول videos الموجود حالياً بنفس السيستم (Cloudflare R2, upload sessions, playback tokens). content_id → videos.id. الفيديو هيكون مرتبط بالكورس عن طريق lesson_id في جدول videos.

لو نوع الدرس pdf: الملف يُرفع على R2 بنفس VideoStorageService (نعيد تسميته StorageService) والبيانات تتخزن في content_config JSON.

لو نوع الدرس exam: الامتحان يتم إنشاؤه في جدول exams الموجود حالياً. content_id → exams.id.

٢. Backend Services & Controllers
٢.١ بنية الـ Domain الجديد
app/Domains/Courses/
├── DTOs/
│   ├── CreateCourseData.php
│   ├── UpdateCourseData.php
│   ├── CreateLevelData.php
│   └── CreateLessonData.php
├── Enums/
│   ├── CourseStatus.php         (draft, published, archived)
│   ├── LessonType.php           (video, pdf, exam)
│   ├── CourseProgressStatus.php  (not_started, in_progress, completed)
│   └── LessonProgressStatus.php (locked, available, in_progress, completed)
├── Events/
│   ├── CoursePublished.php
│   ├── LessonCompleted.php
│   ├── LevelCompleted.php
│   └── CourseCompleted.php
├── Jobs/
│   ├── CalculateCourseStats.php       — إعادة حساب total_duration, total_lessons
│   ├── GrantCourseAccessToGroup.php   — منح الوصول لمجموعة كاملة
│   └── RecalculateProgress.php        — إعادة حساب تقدم الطالب
├── Models/
│   ├── Course.php
│   ├── CourseLevel.php
│   ├── CourseLesson.php
│   ├── CourseGroupTarget.php
│   ├── CourseAccessGrant.php
│   ├── CourseProgress.php
│   └── CourseLessonProgress.php
├── Notifications/
│   ├── CoursePublishedNotification.php
│   ├── LessonCompletedNotification.php
│   ├── LevelCompletedNotification.php
│   └── CourseCompletedNotification.php
├── Policies/
│   └── CoursePolicy.php
├── Resources/
│   ├── CourseResource.php
│   ├── CourseLevelResource.php
│   └── CourseLessonResource.php
└── Services/
    ├── CourseLifecycleService.php      — إنشاء / تعديل / نشر / أرشفة الكورس
    ├── CourseLessonService.php         — إضافة / تعديل / حذف الدروس
    ├── CourseAccessService.php         — منح / سحب الوصول (مثل VideoAccessGrantService)
    ├── CourseProgressService.php       — تتبع التقدم + فتح الدروس التالية
    ├── CoursePdfService.php            — رفع وتأمين وعرض الـ PDFs
    └── CourseAuthorizationService.php  — صلاحيات الوصول والتحقق
٢.٢ API Endpoints
[NEW] routes/api/v1/courses.php
للمدرس / الأكاديمية (Dashboard APIs):

Method	Endpoint	الوصف
GET	/dashboard/courses	قائمة الكورسات
POST	/dashboard/courses	إنشاء كورس جديد
GET	/dashboard/courses/{id}	تفاصيل الكورس
PUT	/dashboard/courses/{id}	تعديل الكورس
DELETE	/dashboard/courses/{id}	حذف الكورس
POST	/dashboard/courses/{id}/publish	نشر الكورس
POST	/dashboard/courses/{id}/archive	أرشفة الكورس
POST	/dashboard/courses/{id}/levels	إضافة مستوى
PUT	/dashboard/courses/{id}/levels/{levelId}	تعديل مستوى
DELETE	/dashboard/courses/{id}/levels/{levelId}	حذف مستوى
POST	/dashboard/courses/{id}/levels/{levelId}/lessons	إضافة درس
PUT	/dashboard/courses/{id}/lessons/{lessonId}	تعديل درس
DELETE	/dashboard/courses/{id}/lessons/{lessonId}	حذف درس
POST	/dashboard/courses/{id}/reorder-levels	إعادة ترتيب المستويات
POST	/dashboard/courses/{id}/levels/{levelId}/reorder-lessons	إعادة ترتيب الدروس
GET	/dashboard/courses/{id}/students	الطلاب المسجلين + تقدمهم
GET	/dashboard/courses/{id}/students/{studentId}/progress	تقدم طالب معين بالتفصيل
للطالب (Student APIs):

Method	Endpoint	الوصف
GET	/student/courses	الكورسات المتاحة للطالب
GET	/student/courses/{id}	تفاصيل الكورس + المستويات والدروس + تقدمه
POST	/student/courses/{id}/lessons/{lessonId}/start	بدء درس
POST	/student/courses/{id}/lessons/{lessonId}/complete	إكمال درس
GET	/student/courses/{id}/lessons/{lessonId}/pdf	عرض PDF (signed URL)
GET	/student/courses/{id}/progress	تقدم الطالب الشامل
NOTE

الـ video lessons تستخدم نفس APIs الفيديوهات الموجودة حالياً (/student/videos/{id}/stream, /student/videos/{id}/token, إلخ). الفرق الوحيد هو أن الفيديو مربوط بـ lesson_id.

٣. لوحة تحكم الأدمن (Filament)
٣.١ الموارد الجديدة
[NEW] app/Filament/Resources/CourseResource.php
العنصر	التفاصيل
القائمة	عرض كل الكورسات - فلترة حسب الحالة / المالك / الصف
التفاصيل	عرض بيانات الكورس + المستويات + الدروس + إحصائيات
الإجراءات	تعليق / حذف / أرشفة كورس
التقارير	عدد الكورسات لكل مدرس، متوسط إكمال الطلاب
الأعمدة في جدول الأدمن:
العمود	الوصف
العنوان	اسم الكورس
المالك	المدرس أو الأكاديمية
الصف	الصف الدراسي
المستويات	عدد المستويات
الدروس	عدد الدروس (فيديو/PDF/امتحان)
الطلاب المسجلين	عدد الطلاب اللي عندهم وصول
متوسط الإكمال	النسبة المئوية المتوسطة لإكمال الكورس
الحالة	draft / published / archived
تاريخ الإنشاء	
٤. واجهة المدرس والأكاديمية (Frontend - Dashboard)
٤.١ صفحات جديدة
frontend/src/app/teacher/courses/
├── page.tsx                    — قائمة الكورسات
├── create/
│   └── page.tsx               — إنشاء كورس جديد (wizard)
└── [id]/
    ├── page.tsx               — تفاصيل الكورس + إدارة المحتوى
    ├── edit/
    │   └── page.tsx           — تعديل بيانات الكورس
    └── students/
        └── page.tsx           — تقدم الطلاب
frontend/src/app/academy/courses/  — نفس البنية
٤.٢ صفحة إنشاء الكورس (Wizard - خطوات)
الخطوة ١ — البيانات الأساسية:

عنوان الكورس
الوصف
الصف الدراسي (Grade)
المجموعات المستهدفة
صورة الغلاف (Thumbnail)
هل لازم يكمل بالترتيب؟ (is_sequential)
الخطوة ٢ — إضافة المستويات والدروس:

TIP

واجهة Drag & Drop تسمح بـ:

إضافة مستوى جديد (مثلاً "الفصل الأول - الحركة")
داخل كل مستوى: إضافة درس (فيديو / PDF / امتحان)
سحب وإفلات لإعادة الترتيب
كل درس يظهر الأيقونة حسب نوعه (🎬 فيديو | 📄 PDF | 📝 امتحان)
لما يختار "إضافة فيديو":

يفتح نفس واجهة رفع الفيديو الحالية (multipart upload to R2)
بنفس الخطوات: اختيار الملف → رفع مباشر لـ Cloudflare R2 → processing
لما يختار "إضافة PDF":

يرفع ملف PDF مباشرة لـ R2
الملف يتخزن بنفس نظام VideoStorageService
ما يظهرش للطالب إلا من خلال signed URL (زي الفيديو)
لما يختار "إضافة امتحان":

يفتح فورم إنشاء الامتحان (نفس فورم الامتحانات الحالي)
يضيف الأسئلة والإجابات
يحدد درجة النجاح وعدد المحاولات
الخطوة ٣ — مراجعة ونشر:

عرض ملخص الكورس كامل
زر "نشر" أو "حفظ كمسودة"
٤.٣ صفحة تفاصيل الكورس (للمدرس)
نظرة عامة: عنوان + وصف + إحصائيات (عدد الطلاب، متوسط الإكمال)
المحتوى: قائمة المستويات والدروس (قابلة للتعديل + إعادة ترتيب)
الطلاب: جدول بكل الطلاب:
الطالب	التقدم	الدروس المكتملة	آخر نشاط	الامتحانات
أحمد محمد	45% ████░░░░░░	5/11	منذ ساعتين	1 ناجح / 1 راسب
تفاصيل طالب معين: عند الضغط على طالب يظهر:
تقدمه في كل مستوى
حالة كل درس (مقفول / متاح / قيد التقدم / مكتمل)
درجاته في الامتحانات
أوقات المشاهدة
٥. واجهة الطالب (Frontend - Student)
٥.١ خياران للعرض
IMPORTANT

السؤال للمستخدم: هل الكورسات تظهر في نفس صفحة الفيديوهات مع section خاص؟ أم في صفحة منفصلة /student/courses؟

الاقتراح: صفحة منفصلة /student/courses مع لينك في الـ sidebar، لأن الكورسات لها طبيعة مختلفة (مستويات + تقدم + امتحانات) ودمجها مع الفيديوهات المستقلة هيكون مربك.

٥.٢ صفحات الطالب
frontend/src/app/student/courses/
├── page.tsx           — قائمة الكورسات المتاحة
└── [id]/
    └── page.tsx       — محتوى الكورس + التقدم
٥.٣ واجهة الطالب - تفاصيل الكورس
┌─────────────────────────────────────────────────┐
│ 📚 الفصل الأول - فيزياء                          │
│ المدرس: أحمد محمد  |  11 درس  |  تقدمك: 45%     │
│ ████████████░░░░░░░░░░░░                         │
├─────────────────────────────────────────────────┤
│                                                   │
│ 📖 المستوى الأول: أساسيات الحركة                 │
│                                                   │
│   ✅ 1. مقدمة في الحركة          🎬  12 دقيقة    │
│   ✅ 2. قوانين نيوتن              🎬  18 دقيقة    │
│   ✅ 3. ملخص الحركة              📄  PDF           │
│   🔵 4. تطبيقات على الحركة        🎬  15 دقيقة    │ ← الدرس الحالي
│   🔒 5. اختبار المستوى الأول      📝  10 أسئلة     │
│                                                   │
│ 📖 المستوى الثاني: الطاقة          🔒              │
│                                                   │
│   🔒 6. مفهوم الطاقة              🎬  20 دقيقة    │
│   🔒 7. أنواع الطاقة              🎬  14 دقيقة    │
│   🔒 8. ملخص الطاقة              📄  PDF           │
│   🔒 9. تمارين الطاقة             🎬  22 دقيقة    │
│   🔒 10. مراجعة شاملة            📄  PDF           │
│   🔒 11. الامتحان النهائي         📝  20 سؤال      │
│                                                   │
└─────────────────────────────────────────────────┘
✅ = مكتمل (أخضر)
🔵 = الدرس الحالي (أزرق مضيء)
🔒 = مقفول (رمادي)
عند الضغط على درس فيديو → يفتح مشغل الفيديو (نفس الكومبوننت الحالي)
عند الضغط على درس PDF → يفتح عارض PDF (inline signed URL)
عند الضغط على درس امتحان → يفتح صفحة الامتحان (نفس الكومبوننت الحالي)
٦. نظام التأمين (Security)
CAUTION

التأمين هو أولوية قصوى. نمشي بنفس مبادئ تأمين الفيديوهات الحالية.

٦.١ تأمين الفيديوهات (نفس النظام الحالي)
✅ رفع مباشر لـ Cloudflare R2 (السيرفر ما يشوفش البيانات)
✅ Playback Tokens (توكن لكل جلسة مشاهدة)
✅ Signed URLs (روابط مؤقتة تنتهي صلاحيتها)
✅ Device Fingerprinting
✅ Access Grants (التحقق من الصلاحية قبل المشاهدة)
✅ Access Logs (تسجيل كل محاولة وصول)
٦.٢ تأمين الـ PDFs (جديد)
الطبقة	التفاصيل
التخزين	الملفات تتخزن على R2 في bucket خاص (private) — ما فيش public access
الوصول	Signed URLs فقط — تنتهي صلاحيتها بعد 30 دقيقة
العرض	يتم عرض الـ PDF داخل iframe من خلال backend proxy (same-origin) لمنع التحميل المباشر
حماية إضافية	- تعطيل كليك يمين (context menu) في عارض الـ PDF
- تعطيل Print (عن طريق CSS @media print { display: none })
Watermark	إضافة watermark ديناميكي باسم الطالب ورقم تليفونه على كل صفحة PDF (server-side باستخدام FPDI أو TCPDF)
Access Logging	تسجيل كل وصول للـ PDF (زي video_access_logs)
٦.٣ تأمين الامتحانات
نفس نظام الامتحانات الحالي
التحقق من إن الطالب كمل الدروس المطلوبة قبل الامتحان
التحقق من إن عنده CourseAccessGrant
٧. نظام Gamification
٧.١ النقاط الجديدة
[MODIFY] 
GamificationSetting.php
إضافة حقول جديدة:

// نقاط الفيديوهات
 'video_watch_points',
 'video_quiz_max_points',
 'video_quiz_perfect_bonus',
 'video_first_watch_bonus',
+// نقاط الكورسات
+'course_lesson_complete_points',    // نقاط إكمال درس (default: 10)
+'course_level_complete_bonus',      // بونص إكمال مستوى كامل (default: 25)
+'course_complete_bonus',            // بونص إنهاء كورس كامل (default: 100)
+'course_streak_3_lessons',          // بونص 3 دروس متتالية (default: 15)
+'course_perfect_exam_bonus',        // بونص امتحان كورس بدرجة كاملة (default: 20)
+'course_fast_complete_bonus',       // بونص إنهاء الكورس في وقت قياسي (default: 50)
[MODIFY] 
PointTransactionType.php
case VIDEO_FIRST_WATCH = 'video_first_watch';
+
+// ─── نقاط الكورسات ────────────────────────────────────────────
+case COURSE_LESSON_COMPLETE = 'course_lesson_complete';
+case COURSE_LEVEL_COMPLETE = 'course_level_complete';
+case COURSE_COMPLETE = 'course_complete';
+case COURSE_LESSON_STREAK = 'course_lesson_streak';
+case COURSE_PERFECT_EXAM = 'course_perfect_exam';
+case COURSE_FAST_COMPLETE = 'course_fast_complete';
[NEW] app/Domains/Gamification/Strategies/CoursePointStrategy.php
يحسب النقاط عند إكمال درس / مستوى / كورس
يتبع نفس pattern الـ VideoPointStrategy
٨. نظام الإشعارات
٨.١ الإشعارات المطلوبة
الحدث	المستلم	الرسالة
كورس جديد منشور	الطالب + ولي الأمر	"تم نشر كورس جديد: {title} من {teacher}"
درس جديد متاح	الطالب	"درس جديد متاح: {lesson} في كورس {course}"
درس مكتمل	ولي الأمر	"ابنك {student} أكمل درس {lesson} في كورس {course}"
مستوى مكتمل	ولي الأمر + المدرس	"الطالب {student} أكمل المستوى {level}"
كورس مكتمل	ولي الأمر + المدرس	"🎉 الطالب {student} أنهى كورس {course}"
نتيجة امتحان الكورس	الطالب + ولي الأمر	"نتيجتك في امتحان {exam}: {score}%"
تذكير بعدم إكمال	الطالب + ولي الأمر	"لم تكمل درس {lesson} منذ {days} أيام"
نقاط جديدة	الطالب	"🏆 حصلت على {points} نقطة لإكمال {achievement}"
٨.٢ آلية الإرسال
Reverb (WebSocket): إشعارات فورية داخل التطبيق (نفس النظام الحالي)
FCM (Firebase): إشعارات Push لأولياء الأمور (نفس NotificationService.sendToParent)
Queue: كل الإشعارات تمر من خلال الـ Queue عشان ما تأثرش على الأداء
٨.٣ التنفيذ
نستخدم نفس 
NotificationService
 الموجود
نضيف Event Listeners جديدة:
LessonCompleted → SendLessonCompletedNotifications
LevelCompleted → SendLevelCompletedNotifications
CourseCompleted → SendCourseCompletedNotifications
CoursePublished → SendCoursePublishedNotifications
ملاحظات مهمة
إعادة استخدام الكومبوننتات الحالية
الكومبوننت	الاستخدام
VideoUploadOrchestrationService
رفع فيديوهات الكورس (نفس flow)
VideoStreamingService
مشاهدة فيديوهات الكورس
VideoPlaybackService	Playback tokens لفيديوهات الكورس
VideoAccessGrantService	نسخ المنطق لـ CourseAccessService
VideoWatchProgress	تتبع مشاهدة الفيديو (يُستخدم مع CourseLessonProgress)
ExamAttempt / ExamResult	امتحانات الكورس (نفس النظام)
NotificationService
إرسال كل الإشعارات
GamificationSetting
 + Strategies	حساب النقاط
التعديلات على الملفات الموجودة
الملف	التعديل
Video.php
إضافة belongsTo(CourseLesson) - اختياري
GamificationSetting.php
إضافة حقول نقاط الكورسات
PointTransactionType.php
إضافة أنواع الكورسات
routes/api.php
تضمين ملف routes الكورسات
Teacher.php / Academy.php	إضافة courses() relationship
Student.php	إضافة courseProgresses() relationship
User Review Required
IMPORTANT

١. مكان عرض الكورسات للطالب
هل الكورسات تظهر في صفحة منفصلة (/student/courses) ولا في نفس صفحة الفيديوهات مع section خاص؟ اقتراحي: صفحة منفصلة مع لينك في الـ sidebar.

IMPORTANT

٢. نظام الدفع للكورسات
هل الكورسات مجانية لكل الطلاب المسجلين عند المدرس؟ ولا ليها سعر منفصل؟ لو ليها سعر هنحتاج نربط مع نظام الاشتراكات.

IMPORTANT

٣. Watermark على الـ PDFs
هل عايز watermark ديناميكي على كل صفحة PDF (اسم الطالب + تليفونه)؟ ده هيأثر على سرعة تحميل الـ PDF شوية بس هيحمي المحتوى بقوة.

IMPORTANT

٤. هل في حد أقصى لعدد المستويات أو الدروس في الكورس الواحد؟
IMPORTANT

٥. ترتيب المراحل
البلان مقسم لـ 8 مراحل. هل عايز نبدأ بالـ backend كامل الأول وبعدين الـ frontend؟ ولا مرحلة مرحلة (DB → Backend → Filament → Dashboard → Student → Gamification → Notifications → Security)؟

Verification Plan
Automated Tests
Unit Tests: اختبار Services (CourseLifecycleService, CourseProgressService, CourseAccessService)

Command: docker exec -it lms-php php artisan test --filter=CourseTest
Feature Tests: اختبار APIs كاملة (CRUD + access control)

Command: docker exec -it lms-php php artisan test --filter=CourseApiTest
Existing Tests: تشغيل الاختبارات الحالية للتأكد ما فيش regression:

docker exec -it lms-php php artisan test --filter=VideoUploadTest
docker exec -it lms-php php artisan test --filter=StudentVideoAccessTest
docker exec -it lms-php php artisan test --filter=GamificationEdgeCaseTest
Manual Verification
NOTE

التحقق اليدوي سيتم بالتنسيق مع المستخدم في كل مرحلة. التفاصيل الدقيقة ستُحدد بعد الاتفاق على البلان.

Filament Admin: التحقق من ظهور الكورسات في لوحة التحكم وإمكانية الإدارة
Teacher Dashboard: إنشاء كورس كامل (فيديو + PDF + امتحان) والتأكد من الرفع
Student View: التأكد من ظهور الكورس + نظام القفل + التقدم
Security: محاولة الوصول لـ PDF بدون صلاحية
Notifications: التأكد من وصول الإشعارات عند كل حدث
Gamification: التأكد من حساب النقاط الصحيحة
