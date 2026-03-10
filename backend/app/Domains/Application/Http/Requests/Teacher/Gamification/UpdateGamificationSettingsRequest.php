<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Gamification;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGamificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendance_points'        => 'sometimes|integer|min:0|max:100',
            'perfect_month_bonus'      => 'sometimes|integer|min:0|max:200',
            'exam_max_points'          => 'sometimes|integer|min:0|max:100',
            'exam_retake_bonus'        => 'sometimes|integer|min:0|max:100',
            'exam_first_place_bonus'   => 'sometimes|integer|min:0|max:100',
            'streak_5_bonus'           => 'sometimes|integer|min:0|max:100',
            'streak_10_bonus'          => 'sometimes|integer|min:0|max:100',
            'is_enabled'               => 'sometimes|boolean',
            'show_leaderboard'         => 'sometimes|boolean',
            'leaderboard_size'         => 'sometimes|integer|min:3|max:20',
            // ─── نقاط الفيديوهات ───────────────────────────────────
            'video_watch_points'       => 'sometimes|integer|min:0|max:100',
            'video_quiz_max_points'    => 'sometimes|integer|min:0|max:100',
            'video_quiz_perfect_bonus' => 'sometimes|integer|min:0|max:100',
            'video_first_watch_bonus'  => 'sometimes|integer|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'attendance_points.integer'           => 'نقاط الحضور يجب أن تكون رقماً صحيحاً',
            'attendance_points.min'               => 'نقاط الحضور لا يمكن أن تكون أقل من 0',
            'attendance_points.max'               => 'نقاط الحضور لا يمكن أن تزيد عن 100',
            'perfect_month_bonus.integer'         => 'مكافأة الشهر الكامل يجب أن تكون رقماً صحيحاً',
            'perfect_month_bonus.min'             => 'مكافأة الشهر الكامل لا يمكن أن تكون أقل من 0',
            'perfect_month_bonus.max'             => 'مكافأة الشهر الكامل لا يمكن أن تزيد عن 200',
            'exam_max_points.integer'             => 'أقصى نقاط للامتحان يجب أن تكون رقماً صحيحاً',
            'exam_max_points.min'                 => 'أقصى نقاط للامتحان لا يمكن أن تكون أقل من 0',
            'exam_max_points.max'                 => 'أقصى نقاط للامتحان لا يمكن أن تزيد عن 100',
            'exam_retake_bonus.integer'           => 'مكافأة إعادة الامتحان يجب أن تكون رقماً صحيحاً',
            'exam_retake_bonus.min'               => 'مكافأة إعادة الامتحان لا يمكن أن تكون أقل من 0',
            'exam_retake_bonus.max'               => 'مكافأة إعادة الامتحان لا يمكن أن تزيد عن 100',
            'exam_first_place_bonus.integer'      => 'مكافأة المركز الأول يجب أن تكون رقماً صحيحاً',
            'exam_first_place_bonus.min'          => 'مكافأة المركز الأول لا يمكن أن تكون أقل من 0',
            'exam_first_place_bonus.max'          => 'مكافأة المركز الأول لا يمكن أن تزيد عن 100',
            'streak_5_bonus.integer'              => 'مكافأة 5 حصص متتالية يجب أن تكون رقماً صحيحاً',
            'streak_5_bonus.min'                  => 'مكافأة 5 حصص متتالية لا يمكن أن تكون أقل من 0',
            'streak_5_bonus.max'                  => 'مكافأة 5 حصص متتالية لا يمكن أن تزيد عن 100',
            'streak_10_bonus.integer'             => 'مكافأة 10 حصص متتالية يجب أن تكون رقماً صحيحاً',
            'streak_10_bonus.min'                 => 'مكافأة 10 حصص متتالية لا يمكن أن تكون أقل من 0',
            'streak_10_bonus.max'                 => 'مكافأة 10 حصص متتالية لا يمكن أن تزيد عن 100',
            'is_enabled.boolean'                  => 'حقل التفعيل يجب أن يكون صحيحاً أو خطأ',
            'show_leaderboard.boolean'            => 'حقل إظهار لوحة المتصدرين يجب أن يكون صحيحاً أو خطأ',
            'leaderboard_size.integer'            => 'حجم لوحة المتصدرين يجب أن يكون رقماً صحيحاً',
            'leaderboard_size.min'                => 'حجم لوحة المتصدرين لا يمكن أن يكون أقل من 3',
            'leaderboard_size.max'                => 'حجم لوحة المتصدرين لا يمكن أن يزيد عن 20',
            // نقاط الفيديو
            'video_watch_points.integer'          => 'نقاط مشاهدة الفيديو يجب أن تكون رقماً صحيحاً',
            'video_watch_points.min'              => 'نقاط مشاهدة الفيديو لا يمكن أن تكون أقل من 0',
            'video_watch_points.max'              => 'نقاط مشاهدة الفيديو لا يمكن أن تزيد عن 100',
            'video_quiz_max_points.integer'       => 'أقصى نقاط تدريب الفيديو يجب أن تكون رقماً صحيحاً',
            'video_quiz_max_points.min'           => 'أقصى نقاط تدريب الفيديو لا يمكن أن تكون أقل من 0',
            'video_quiz_max_points.max'           => 'أقصى نقاط تدريب الفيديو لا يمكن أن تزيد عن 100',
            'video_quiz_perfect_bonus.integer'    => 'بونص الدرجة الكاملة يجب أن يكون رقماً صحيحاً',
            'video_quiz_perfect_bonus.min'        => 'بونص الدرجة الكاملة لا يمكن أن يكون أقل من 0',
            'video_quiz_perfect_bonus.max'        => 'بونص الدرجة الكاملة لا يمكن أن يزيد عن 100',
            'video_first_watch_bonus.integer'     => 'بونص أول مشاهد يجب أن يكون رقماً صحيحاً',
            'video_first_watch_bonus.min'         => 'بونص أول مشاهد لا يمكن أن يكون أقل من 0',
            'video_first_watch_bonus.max'         => 'بونص أول مشاهد لا يمكن أن يزيد عن 100',
        ];
    }
}
