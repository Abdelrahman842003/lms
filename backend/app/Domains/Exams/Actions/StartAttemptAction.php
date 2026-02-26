<?php

declare(strict_types=1);

namespace App\Domains\Exams\Actions;

use App\Domains\Exams\Builders\ExamAttemptBuilder;
use App\Domains\Exams\Events\ExamStarted;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Support\Exceptions\DomainException;

final class StartAttemptAction
{
    public function __construct(
        private readonly ExamAttemptBuilder $builder,
    ) {}

    /**
     * @throws DomainException
     */
    public function execute(Exam $exam, int $studentId): ExamAttempt
    {
        // 1. الامتحان مفعّل؟
        if (! $exam->is_active) {
            throw new DomainException('هذا الامتحان غير مفعّل حالياً.', 403);
        }

        // 2. هل يوجد محاولة جارية بالفعل؟
        $existing = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $studentId)
            ->where('status', 'in_progress')
            ->first();

        if ($existing) {
            return $existing; // إرجاع نفس المحاولة
        }

        // 3. هل سبق له إكمال الامتحان؟
        $completed = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $studentId)
            ->where('status', 'completed')
            ->exists();

        if ($completed) {
            throw new DomainException('لقد أنهيت هذا الامتحان مسبقاً.', 409);
        }

        // 4. بناء المحاولة
        $attempt = $this->builder->createAttempt($exam, $studentId);

        // 5. إطلاق الحدث
        ExamStarted::dispatch($attempt);

        return $attempt;
    }
}
