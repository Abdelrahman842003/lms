<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Enums;

enum PointTransactionType: string
{
    // الأنواع الأساسية الشغالة حالياً
    case ATTENDANCE = 'attendance';              // حضور الحصة
    case PERFECT_MONTH = 'perfect_month';        // حضور شهر كامل
    case EXAM_SCORE = 'exam_score';              // درجة الامتحان
    case EXAM_RETAKE_BONUS = 'exam_retake_bonus'; // إعادة الامتحان بنجاح
    case EXAM_FIRST_PLACE = 'exam_first_place';  // أول الدفعة
    case STREAK_5 = 'streak_5';                  // سلسلة 5 حصص
    case STREAK_10 = 'streak_10';                // سلسلة 10 حصص
    case MANUAL_BONUS = 'manual_bonus';          // بونص يدوي من المدرس

    // ─── نقاط الفيديوهات ───────────────────────────────────────────
    case VIDEO_WATCHED = 'video_watched';                // مشاهدة فيديو كاملاً
    case VIDEO_QUIZ_PASSED = 'video_quiz_passed';        // اجتياز تدريب الفيديو
    case VIDEO_QUIZ_PERFECT = 'video_quiz_perfect';      // اجتياز التدريب بدرجة كاملة 100%
    case VIDEO_FIRST_WATCH = 'video_first_watch';        // أول طالب يشاهد الفيديو

    /**
     * Get the Arabic name for the transaction type
     */
    public function label(): string
    {
        return match ($this) {
            self::ATTENDANCE       => 'حضور الحصة',
            self::PERFECT_MONTH    => 'حضور شهر كامل',
            self::EXAM_SCORE       => 'درجة الامتحان',
            self::EXAM_RETAKE_BONUS => 'بونص إعادة الامتحان',
            self::EXAM_FIRST_PLACE => 'أول الدفعة',
            self::STREAK_5         => 'سلسلة 5 حصص',
            self::STREAK_10        => 'سلسلة 10 حصص',
            self::MANUAL_BONUS     => 'بونص من المدرس',
            self::VIDEO_WATCHED    => 'مشاهدة فيديو',
            self::VIDEO_QUIZ_PASSED  => 'اجتياز تدريب الفيديو',
            self::VIDEO_QUIZ_PERFECT => 'تدريب الفيديو بدرجة كاملة',
            self::VIDEO_FIRST_WATCH  => 'أول مشاهد للفيديو',
        };
    }

    /**
     * Get all valid values as an array (for validation)
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Check if a value is valid
     */
    public static function isValid(string $value): bool
    {
        return in_array($value, self::values(), true);
    }

    /**
     * Get all types as select options for frontend
     */
    public static function options(): array
    {
        return array_map(
            fn(self $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ],
            self::cases()
        );
    }
}
