<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Application\Models\Setting;
use App\Domains\Gamification\Models\GamificationSetting;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class GamificationSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationLabel = 'إعدادات النقاط (Gamification)';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات نظام النقاط العامة';

    protected static ?string $slug = 'gamification-global-settings';

    protected static ?int $navigationSort = 110;

    protected string $view = 'filament.pages.gamification-settings';

    // مفاتيح الإعدادات العامة
    protected const SETTING_KEYS = [
        'gamification_is_enabled',
        'gamification_show_leaderboard',
        'gamification_leaderboard_size',
        // نقاط الحضور
        'gamification_attendance_points',
        'gamification_perfect_month_bonus',
        // نقاط الامتحانات
        'gamification_exam_max_points',
        'gamification_exam_first_place_bonus',
        'gamification_exam_retake_bonus',
        'gamification_exam_fail_deduction',
        'gamification_exam_passing_percentage',
        // نقاط الأسئلة (بنك الأسئلة / اختبر نفسك)
        'gamification_question_easy_points',
        'gamification_question_medium_points',
        'gamification_question_hard_points',
        // مكافآت الاستمرارية
        'gamification_streak_5_bonus',
        'gamification_streak_10_bonus',
        // نقاط الفيديوهات
        'gamification_video_watch_points',
        'gamification_video_quiz_max_points',
        'gamification_video_quiz_perfect_bonus',
        'gamification_video_first_watch_bonus',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        // ملء البيانات من جدول الإعدادات أو القيم الافتراضية من الـ Model
        $defaults = GamificationSetting::DEFAULTS;
        
        $formData = [];
        foreach (self::SETTING_KEYS as $key) {
            // إزالة بادئة gamification_ للحصول على المفتاح الأصلي في DEFAULTS
            $originalKey = str_replace('gamification_', '', $key);
            $defaultValue = $defaults[$originalKey] ?? null;
            
            $formData[$key] = Setting::getValue($key, (string) $defaultValue);
        }

        $this->form->fill($formData);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('الإعدادات العامة للنظام')
                    ->schema([
                        Toggle::make('gamification_is_enabled')
                            ->label('تفعيل نظام النقاط للمشروع بالكامل')
                            ->default(true),

                        Toggle::make('gamification_show_leaderboard')
                            ->label('إظهار لوحة المتصدرين للطلاب')
                            ->default(true),

                        TextInput::make('gamification_leaderboard_size')
                            ->label('عدد الطلاب المختارين في لوحة المتصدرين')
                            ->numeric()
                            ->default(5),
                    ])
                    ->columns(3),

                Section::make('نقاط الحضور والغياب')
                    ->description('تُطبق هذه النقاط عند تسجيل حضور الطالب في المحاضرات.')
                    ->schema([
                        TextInput::make('gamification_attendance_points')
                            ->label('نقاط تسجيل الحضور')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_perfect_month_bonus')
                            ->label('مكافأة الحضور الكامل شهرياً')
                            ->numeric()
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('نقاط الامتحانات العادية')
                    ->description('تُحدد كيفية توزيع النقاط بناءً على نتائج الامتحانات الكلاسيكية.')
                    ->schema([
                        TextInput::make('gamification_exam_max_points')
                            ->label('الحد الأقصى لنقاط الامتحان (عند 100%)')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_exam_first_place_bonus')
                            ->label('مكافأة الحصول على المركز الأول')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_exam_retake_bonus')
                            ->label('نقاط إعادة الامتحان (Bonus)')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_exam_fail_deduction')
                            ->label('نقاط الخصم عند الرسوب')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_exam_passing_percentage')
                            ->label('درجة النجاح (%)')
                            ->numeric()
                            ->required()
                            ->suffix('%'),
                    ])
                    ->columns(3),

                Section::make('نقاط أسئلة الاختبارات الديناميكية (اختبر نفسك)')
                    ->description('يتم حساب النقاط في الامتحانات الديناميكية بناءً على صعوبة كل سؤال أجابه الطالب إجابة صحيحة.')
                    ->schema([
                        TextInput::make('gamification_question_easy_points')
                            ->label('نقاط السؤال السهل')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_question_medium_points')
                            ->label('نقاط السؤال المتوسط')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_question_hard_points')
                            ->label('نقاط السؤال الصعب')
                            ->numeric()
                            ->required(),
                    ])
                    ->columns(3),

                Section::make('مكافآت الاستمرارية (Streaks)')
                    ->description('مكافآت تُمنح للطلاب الملتزمين بالحضور المستمر.')
                    ->schema([
                        TextInput::make('gamification_streak_5_bonus')
                            ->label('مكافأة الالتزام بـ 5 محاضرات متتالية')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_streak_10_bonus')
                            ->label('مكافأة الالتزام بـ 10 محاضرات متتالية')
                            ->numeric()
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('نقاط الفيديوهات التعليمية')
                    ->description('النقاط المكتسبة من مشاهدة المحتوى المرئي واختباراته.')
                    ->schema([
                        TextInput::make('gamification_video_watch_points')
                            ->label('نقاط مشاهدة الفيديو كاملاً')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_video_quiz_max_points')
                            ->label('الحد الأقصى لنقاط اختبار الفيديو')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_video_quiz_perfect_bonus')
                            ->label('مكافأة الدرجة النهائية في اختبار الفيديو')
                            ->numeric()
                            ->required(),

                        TextInput::make('gamification_video_first_watch_bonus')
                            ->label('مكافأة أول مشاهدة للفيديو')
                            ->numeric()
                            ->required(),
                    ])
                    ->columns(2),
            ]);
    }

    public function save(): void
    {
        try {
            $state = $this->form->getState();

            foreach (self::SETTING_KEYS as $key) {
                if (! array_key_exists($key, $state)) {
                    continue;
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => (string) $state[$key],
                        'group' => 'gamification',
                    ]
                );
            }

            // مسح الكاش لضمان تطبيق التغييرات فوراً
            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ إعدادات النقاط العامة بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }
}
