نظام المستويات والإنجازات (Gamification Levels & Achievements)
نظام مبني فوق نظام النقاط الموجود حالياً. الطالب يبدأ من 0 نقطة ويترقى تلقائياً عبر 10 مستويات بأسماء عربية. عند كل ترقية يحصل على شهادة PDF تلقائية.

IMPORTANT

النقاط موجودة حالياً بنظام per-teacher (كل مدرس له نقاط منفصلة). المستويات الجديدة هتكون كمان per-teacher — يعني الطالب ممكن يكون مستوى مختلف عند كل مدرس.

الأسماء المقترحة للمستويات العشرة
أسماء مستوحاة من الحضارة العربية القديمة (مناسبة للمسلمين والمسيحيين):

#	الاسم	المعنى	النقاط (افتراضي)
1	طالب مبتدئ	بداية الرحلة	0 – 99
2	باحث	يبحث عن المعرفة	100 – 299
3	دارس	يتعلم ويجتهد	300 – 599
4	متعلم	اكتسب أساسيات	600 – 999
5	أديب	لديه أدب العلم	1,000 – 1,499
6	عالِم	وصل لمرتبة العلم	1,500 – 2,199
7	حكيم	حكمة وفهم عميق	2,200 – 2,999
8	نابغة	تفوق واضح	3,000 – 3,999
9	عبقري	عقل متميز	4,000 – 5,499
10	فيلسوف	قمة المعرفة	5,500+
NOTE

الحدود (النقاط) قابلة للتعديل من لوحة تحكم الأدمن في Filament. الأسماء والأيقونات كمان قابلة للتعديل.

Proposed Changes
Database & Models
[NEW] 
create_gamification_levels_table.php
// gamification_levels
Schema::create('gamification_levels', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');              // "حكيم"
    $table->string('description')->nullable();
    $table->string('icon')->nullable();  // SVG name or emoji
    $table->string('color')->nullable(); // hex color for UI
    $table->integer('min_points');       // 0
    $table->integer('max_points')->nullable(); // null = unlimited (last level)
    $table->integer('sort_order');       // 1-10
    $table->timestamps();
    $table->unique('sort_order');
    $table->index('min_points');
});
[NEW] 
create_student_level_history_table.php
// student_level_history — سجل ترقيات الطالب + شهادات
Schema::create('student_level_history', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('teacher_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('level_id')->constrained('gamification_levels')->cascadeOnDelete();
    $table->integer('points_at_levelup');          // النقاط وقت الترقية
    $table->string('certificate_path')->nullable(); // مسار PDF في storage
    $table->timestamp('achieved_at');
    $table->timestamps();
    $table->index(['student_id', 'teacher_id']);
});
[MODIFY] 
add_current_level_to_student_points.php
إضافة current_level_id لجدول student_points:

+$table->foreignUuid('current_level_id')->nullable()
+    ->constrained('gamification_levels')->nullOnDelete();
[NEW] 
GamificationLevel.php
class GamificationLevel extends Model
{
    use HasUuids;
    protected $fillable = ['name', 'description', 'icon', 'color',
                           'min_points', 'max_points', 'sort_order'];
    public function isLastLevel(): bool { return $this->max_points === null; }
    public function containsPoints(int $points): bool {
        return $points >= $this->min_points
            && ($this->max_points === null || $points <= $this->max_points);
    }
    public static function findForPoints(int $points): ?self {
        return static::where('min_points', '<=', $points)
            ->where(fn($q) => $q->where('max_points', '>=', $points)->orWhereNull('max_points'))
            ->orderByDesc('sort_order')
            ->first();
    }
}
[NEW] 
StudentLevelHistory.php
class StudentLevelHistory extends Model
{
    use HasUuids;
    protected $table = 'student_level_history';
    protected $fillable = ['student_id', 'teacher_id', 'level_id',
                           'points_at_levelup', 'certificate_path', 'achieved_at'];
    protected $casts = ['achieved_at' => 'datetime'];
    public function student(): BelongsTo { ... }
    public function teacher(): BelongsTo { ... }
    public function level(): BelongsTo { ... }
}
[MODIFY] 
StudentPoint.php
protected $fillable = [
     'student_id',
     'teacher_id',
     'attendance_streak',
     'total_points',
+    'current_level_id',
 ];
+public function currentLevel(): BelongsTo
+{
+    return $this->belongsTo(GamificationLevel::class, 'current_level_id');
+}
+
+public function levelHistory(): HasMany
+{
+    return $this->hasMany(StudentLevelHistory::class, 'student_id', 'student_id')
+        ->where('teacher_id', $this->teacher_id);
+}
[NEW] 
GamificationLevelSeeder.php
Seeder بالـ 10 مستويات الافتراضية (الجدول أعلاه).

Services & Logic
[NEW] 
LevelService.php
class LevelService
{
    // Check if student should level up, perform level up, generate certificate
    public function checkAndLevelUp(StudentPoint $studentPoint): ?StudentLevelHistory;
    // Get student's current level info + progress to next
    public function getStudentLevelInfo(string $studentId, string $teacherId): array;
    // Generate PDF certificate for a level-up
    public function generateCertificate(StudentLevelHistory $history): string;
}
يُستدعى بعد كل 
addPoints()
 في 
StudentPoint
يولّد شهادة PDF عبر Blade template + DomPDF
[MODIFY] 
StudentPoint.php
 — 
addPoints()
public function addPoints(...): PointTransaction
 {
     $this->increment('total_points', $points);
     $transaction = PointTransaction::create([...]);
+    // Check for level-up after points change
+    app(LevelService::class)->checkAndLevelUp($this);
     return $transaction;
 }
[NEW] 
certificate.blade.php
شهادة PDF بتصميم أنيق تحتوي على:

اسم المنصة
اسم الطالب
اسم المستوى الجديد + أيقونته
تاريخ الإنجاز
بدون ذكر عدد النقاط
API Endpoints
[MODIFY] 
student.php
// Gamification
 Route::get('/points', [GamificationController::class, 'index']);
 ...
+// Achievements
+Route::get('/achievements', [AchievementController::class, 'index']);
+Route::get('/achievements/certificate/{history}/download',
+    [AchievementController::class, 'downloadCertificate']);
[NEW] 
AchievementController.php
index()
 — يرجع: المستوى الحالي، نسبة التقدم للمستوى التالي، سجل المستويات السابقة، الشهادات
downloadCertificate($historyId) — يرجع PDF للتحميل
Response schema لـ 
index()
:

{
  "data": {
    "per_teacher": [
      {
        "teacher": { "id": "...", "name": "...", "avatar_key": "..." },
        "total_points": 1250,
        "current_level": {
          "id": "...", "name": "أديب", "icon": "📚", "color": "#FFD700",
          "sort_order": 5, "min_points": 1000, "max_points": 1499
        },
        "next_level": {
          "name": "عالِم", "min_points": 1500
        },
        "progress_percentage": 50.0,
        "points_to_next_level": 250,
        "history": [
          {
            "id": "...", "level_name": "متعلم", "achieved_at": "...",
            "has_certificate": true
          }
        ]
      }
    ]
  }
}
Filament Admin
[NEW] 
GamificationLevelResource.php
صفحة إدارة المستويات في لوحة الأدمن:

العمود	الوصف
الترتيب	رقم المستوى (1-10)
الاسم	اسم المستوى بالعربي
الوصف	وصف مختصر
الأيقونة	emoji أو اسم أيقونة
اللون	لون المستوى
الحد الأدنى	أقل عدد نقاط
الحد الأقصى	أعلى عدد نقاط
إنشاء / تعديل / حذف مستويات
تنبيه عند وجود فجوات أو تداخل في حدود النقاط
Frontend — صفحة إنجازاتي
[NEW] 
/student/achievements/page.tsx
صفحة "إنجازاتي" تحتوي على:

كارت المستوى الحالي — أيقونة + اسم المستوى + لون + باقي نقاط للمستوى التالي
شريط التقدم — progress bar من المستوى الحالي للمستوى التالي
قائمة المستويات كلها — timeline يوضح أي مستويات اتحققت وأيها بعده
سجل الشهادات — قائمة بالشهادات السابقة مع زر تحميل لكل واحدة
NOTE

لو الطالب مسجل عند أكتر من مدرس، يظهر tabs أو cards لكل مدرس.

User Review Required
IMPORTANT

١. أسماء المستويات: هل الأسماء المقترحة أعلاه (طالب مبتدئ → فيلسوف) مناسبة؟ ولا عندك أسماء تانية مفضلة؟

IMPORTANT

٢. حدود النقاط الافتراضية: الحدود المقترحة (0-99, 100-299, ..., 5500+) هل ممكن تكون مناسبة كبداية؟ (قابلة للتعديل من الأدمن)

IMPORTANT

٣. تصميم الشهادة: هل عندك تصميم معين أو logo للمنصة عايز يظهر على الشهادة؟ ولا أنا أعمل تصميم بسيط وأنيق؟

IMPORTANT

٤. مكتبة الـ PDF: سأستخدم DomPDF (مدمجة مع Laravel بسهولة). هل ده مناسب؟

IMPORTANT

٥. المستويات Global ولا Per-Teacher? النظام الحالي فيه النقاط per-teacher. المقترح إن المستويات تكون كمان per-teacher (الطالب ممكن يكون "حكيم" عند مدرس و"دارس" عند مدرس تاني). هل ده المطلوب؟ ولا عايز المستويات تكون global (مجموع كل النقاط)؟

Verification Plan
Automated Tests
Unit Tests — LevelService:

docker exec -it lms-php php artisan test --filter=LevelServiceTest
اختبار findForPoints() يرجع المستوى الصحيح
اختبار level-up عند إضافة نقاط تتجاوز الحد
اختبار عدم level-up لو الطالب في نفس المستوى
اختبار شهادة تتولد عند الترقية
اختبار حالة آخر مستوى (بدون max_points)
Feature Tests — Achievements API:

docker exec -it lms-php php artisan test --filter=AchievementApiTest
GET /student/achievements يرجع بيانات صحيحة
GET /student/achievements/certificate/{id}/download يرجع PDF
Unauthorized access يرجع 401/403
Existing Tests — Regression:

docker exec -it lms-php php artisan test --filter=GamificationEdgeCaseTest
التأكد إن التعديل على 
addPoints()
 ما كسرش حاجة
Manual Verification
NOTE

التحقق اليدوي يحتاج تشغيل المشروع. الخطوات التالية للتحقق بعد ما المشروع يكون شغال:

Filament Admin: الدخول على /admin/gamification-levels والتأكد من ظهور المستويات العشرة + إمكانية تعديل الحدود
Student API: استدعاء GET /api/v1/student/achievements والتأكد من صحة الـ response
Certificate: التأكد من إن الشهادة PDF تتحمل بنجاح
Frontend: الدخول على صفحة إنجازاتي في الواجهة والتأكد من العرض الصحيح

Comment
Ctrl+Alt+M
