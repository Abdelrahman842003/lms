<?php

declare(strict_types=1);

namespace App\Domains\Videos\Resources;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Videos\Enums\VideoOwnerType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class VideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $studentActivityPayload = $this->shouldIncludeStudentActivity($request)
            ? $this->buildStudentActivityPayload()
            : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'owner_type' => $this->owner_type?->value,
            'owner_id' => $this->owner_id,
            'academy_id' => $this->academy_id,
            'teacher_reference' => [
                'id' => $this->teacher_reference_id,
                'name' => $this->teacher_reference_name ?? $this->teacherReference?->name,
            ],
            'grade_id' => $this->grade_id,
            'grade' => $this->whenLoaded('grade', fn () => [
                'id' => $this->grade->id,
                'name' => $this->grade->name,
            ]),
            'groups' => $this->whenLoaded('groups', fn () => $this->groups->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->name,
            ])->values()),
            'lecture_id' => $this->lecture_id,
            'lesson_id' => $this->lesson_id,
            'status' => $this->status?->value,
            'processing_status' => $this->processing_status?->value,
            'scheduled_at' => $this->scheduled_at,
            'published_at' => $this->published_at,
            'available_from' => $this->available_from,
            'available_until' => $this->available_until,
            'duration_seconds' => $this->duration_seconds,
            'width' => $this->width,
            'height' => $this->height,
            'codec' => $this->codec,
            'frame_rate' => $this->frame_rate,
            'thumbnail_url' => $this->thumbnail_path
                ? (function () use ($request): ?string {
                    $user = $request->user();
                    if ($user instanceof Student) {
                        return url('/api/v1/student/videos/'.$this->id.'/thumbnail');
                    }
                    if ($user instanceof Teacher) {
                        return url('/api/v1/teacher/videos/'.$this->id.'/thumbnail');
                    }
                    if ($user instanceof Academy || $user instanceof Secretary) {
                        return url('/api/v1/academy/videos/'.$this->id.'/thumbnail');
                    }

                    return null;
                })()
                : null,
            'processing_error' => $this->processing_error,
            'likes_count' => $this->whenCounted('likes', (int) $this->likes_count),
            'liked_by_me' => $this->relationLoaded('likes') ? $this->likes->isNotEmpty() : null,
            'comments_count' => $this->whenCounted('comments', (int) $this->comments_count),
            'attachments_count' => $this->whenCounted('attachments', (int) $this->attachments_count),
            'quiz_count' => $this->whenCounted('quiz', (int) $this->quiz_count),
            'watch_progresses_count' => $this->whenCounted('watchProgresses', (int) $this->watch_progresses_count),
            'attachments' => VideoAttachmentResource::collection($this->whenLoaded('attachments')),
            // ─── التدريب ──────────────────────────────────────────────────
            'quiz' => $this->whenLoaded('quiz', function () use ($request): ?array {
                $quiz = $this->quiz;
                if (! $quiz) {
                    return null;
                }

                $base = [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'passing_score' => $quiz->passing_score,
                    'is_required' => $quiz->is_required,
                    'is_active' => $quiz->is_active,
                    'questions_count' => $quiz->relationLoaded('questions')
                        ? $quiz->questions->count()
                        : $quiz->questions()->count(),
                ];

                // للطالب: نضيف حالته الشخصية
                $user = $request->user();
                if ($user instanceof Student) {
                    $progress = $this->watchProgresses
                        ->where('student_id', $user->id)
                        ->first();
                    $base['my_status'] = [
                        'passed' => $progress && $progress->quiz_passed_at !== null,
                        'quiz_passed_at' => $progress?->quiz_passed_at,
                    ];
                }

                return $base;
            }),
            'student_activity_summary' => $this->when(
                $studentActivityPayload !== null,
                $studentActivityPayload['summary']
            ),
            'student_activity_details' => $this->when(
                $studentActivityPayload !== null,
                $studentActivityPayload['students']
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function shouldIncludeStudentActivity(Request $request): bool
    {
        $user = $request->user();

        if ($user && ! $user instanceof Student) {
            return true;
        }

        $route = $request->route();
        $controllerAction = is_object($route)
            ? (string) data_get($route->getAction(), 'controller', '')
            : '';
        $segments = $request->segments();

        if (
            str_contains($controllerAction, '\\Teacher\\VideoController@')
            || str_contains($controllerAction, '\\Academy\\VideoController@')
            || in_array('teacher', $segments, true)
            || in_array('academy', $segments, true)
        ) {
            return true;
        }

        if (
            $request->is('api/v1/teacher/*')
            || $request->is('api/v1/academy/*')
            || $request->is('v1/teacher/*')
            || $request->is('v1/academy/*')
            || $request->is('teacher/*')
            || $request->is('academy/*')
        ) {
            return true;
        }

        return $user instanceof Teacher
            || $user instanceof Academy
            || $user instanceof Secretary;
    }

    /**
     * @return array{summary: array<string, int>, students: array<int, array<string, mixed>>}
     */
    private function buildStudentActivityPayload(): array
    {
        /** @var Collection<string, string> $targetStudents */
        $targetStudents = $this->resolveTargetStudents();

        /** @var Collection<int, \App\Domains\Videos\Models\VideoWatchProgress> $watchProgresses */
        $watchProgresses = $this->relationLoaded('watchProgresses')
            ? $this->watchProgresses
            : $this->watchProgresses()->with('student:id,name')->get();

        /** @var Collection<int, \App\Domains\Videos\Models\VideoQuizAttempt> $quizAttempts */
        $quizAttempts = collect();
        if ($this->relationLoaded('quiz') && $this->quiz && $this->quiz->relationLoaded('attempts')) {
            $quizAttempts = $this->quiz->attempts;
        } elseif ($this->relationLoaded('quiz') && $this->quiz) {
            $quizAttempts = $this->quiz->attempts()->with('student:id,name')->get();
        } else {
            $quiz = $this->quiz()->first();
            if ($quiz) {
                $quizAttempts = $quiz->attempts()->with('student:id,name')->get();
            }
        }

        $studentsById = [];

        foreach ($targetStudents as $studentId => $studentName) {
            $studentsById[(string) $studentId] = [
                'student_id' => (string) $studentId,
                'student_name' => (string) $studentName,
                'watch' => [
                    'status' => 'not_started',
                    'watched_seconds' => 0,
                    'watched_percentage' => 0,
                    'last_watched_at' => null,
                    'completed_at' => null,
                ],
                'quiz' => [
                    'attempted' => false,
                    'attempts_count' => 0,
                    'best_percentage' => null,
                    'latest_percentage' => null,
                    'best_status' => null,
                    'last_attempt_at' => null,
                ],
            ];
        }

        foreach ($watchProgresses as $progress) {
            $studentId = (string) $progress->student_id;
            $studentsById[$studentId] = [
                'student_id' => $studentId,
                'student_name' => $progress->relationLoaded('student') && $progress->student
                    ? (string) $progress->student->name
                    : 'طالب غير معروف',
                'watch' => [
                    'status' => is_object($progress->status)
                        ? (string) $progress->status->value
                        : (string) $progress->status,
                    'watched_seconds' => (int) $progress->watched_seconds,
                    'watched_percentage' => (float) $progress->watched_percentage,
                    'last_watched_at' => $progress->last_watched_at,
                    'completed_at' => $progress->completed_at,
                ],
                'quiz' => [
                    'attempted' => false,
                    'attempts_count' => 0,
                    'best_percentage' => null,
                    'latest_percentage' => null,
                    'best_status' => null,
                    'last_attempt_at' => null,
                ],
            ];
        }

        $attemptsByStudent = $quizAttempts->groupBy(fn ($attempt) => (string) $attempt->student_id);

        foreach ($attemptsByStudent as $studentId => $attempts) {
            $latestAttempt = $attempts
                ->sortByDesc(fn ($attempt) => $attempt->completed_at ?? $attempt->created_at)
                ->first();

            $bestAttempt = $attempts
                ->sortByDesc(fn ($attempt) => (float) $attempt->percentage)
                ->first();

            if (! isset($studentsById[$studentId])) {
                $firstAttempt = $attempts->first();
                $studentName = 'طالب غير معروف';

                if ($firstAttempt && $firstAttempt->relationLoaded('student') && $firstAttempt->student) {
                    $studentName = (string) $firstAttempt->student->name;
                }

                $studentsById[$studentId] = [
                    'student_id' => (string) $studentId,
                    'student_name' => $studentName,
                    'watch' => [
                        'status' => 'not_started',
                        'watched_seconds' => 0,
                        'watched_percentage' => 0,
                        'last_watched_at' => null,
                        'completed_at' => null,
                    ],
                    'quiz' => [
                        'attempted' => false,
                        'attempts_count' => 0,
                        'best_percentage' => null,
                        'latest_percentage' => null,
                        'best_status' => null,
                        'last_attempt_at' => null,
                    ],
                ];
            }

            $studentsById[$studentId]['quiz'] = [
                'attempted' => true,
                'attempts_count' => $attempts->count(),
                'best_percentage' => $bestAttempt ? (float) $bestAttempt->percentage : null,
                'latest_percentage' => $latestAttempt ? (float) $latestAttempt->percentage : null,
                'best_status' => $bestAttempt ? (string) $bestAttempt->status : null,
                'last_attempt_at' => $latestAttempt?->completed_at,
            ];
        }

        $students = collect($studentsById)
            ->values()
            ->sortByDesc(function (array $row): float {
                return ((float) data_get($row, 'watch.watched_percentage', 0) * 1000)
                    + (float) data_get($row, 'quiz.best_percentage', 0);
            })
            ->values()
            ->all();

        $studentsCollection = collect($students);

        $targetStudentIds = $targetStudents
            ->keys()
            ->map(fn ($id) => (string) $id)
            ->all();

        $summaryStudents = ! empty($targetStudentIds)
            ? $studentsCollection->filter(fn ($row) => in_array((string) data_get($row, 'student_id'), $targetStudentIds, true))
            : $studentsCollection;

        $targetStudentsCount = ! empty($targetStudentIds)
            ? count($targetStudentIds)
            : $summaryStudents->count();

        return [
            'summary' => [
                'target_students_count' => $targetStudentsCount,
                'attended_students_count' => $summaryStudents
                    ->filter(fn ($row) => (float) data_get($row, 'watch.watched_percentage', 0) > 0)
                    ->count(),
                'quiz_attempted_students_count' => $summaryStudents
                    ->filter(fn ($row) => (bool) data_get($row, 'quiz.attempted', false))
                    ->count(),
                'quiz_attempts_count' => $summaryStudents
                    ->sum(fn ($row) => (int) data_get($row, 'quiz.attempts_count', 0)),
                'quiz_passed_students_count' => $summaryStudents
                    ->filter(fn ($row) => (string) data_get($row, 'quiz.best_status') === 'passed')
                    ->count(),
            ],
            'students' => $students,
        ];
    }

    /**
     * Resolve all target students for this video (grants first, then enrollment fallback).
     *
     * @return Collection<string, string> key=student_id, value=student_name
     */
    private function resolveTargetStudents(): Collection
    {
        $grants = $this->relationLoaded('accessGrants')
            ? $this->accessGrants->whereNull('revoked_at')
            : $this->accessGrants()->whereNull('revoked_at')->with('student:id,name')->get();

        if ($grants->isNotEmpty()) {
            return $grants
                ->mapWithKeys(function ($grant): array {
                    $studentId = (string) $grant->student_id;
                    $studentName = $grant->relationLoaded('student') && $grant->student
                        ? (string) $grant->student->name
                        : 'طالب غير معروف';

                    return [$studentId => $studentName];
                });
        }

        $groupIds = $this->relationLoaded('groups')
            ? $this->groups->pluck('id')->filter()->all()
            : $this->groups()->pluck('groups.id')->filter()->all();

        $enrollmentBaseQuery = Enrollment::query()
            ->with('student:id,name')
            ->where('grade_id', $this->grade_id)
            ->whereNull('deleted_at')
            ->when(! empty($groupIds), fn ($q) => $q->whereIn('group_id', $groupIds))
            ->when(
                $this->owner_type === VideoOwnerType::INDEPENDENT_TEACHER,
                fn ($q) => $q->where('teacher_id', $this->owner_id),
                fn ($q) => $q->where('academy_id', $this->academy_id ?: $this->owner_id)
            );

        $activeEnrollments = (clone $enrollmentBaseQuery)
            ->where('is_active', true)
            ->get();

        $enrollments = $activeEnrollments->isNotEmpty()
            ? $activeEnrollments
            : $enrollmentBaseQuery->get();

        return $enrollments
            ->filter(fn ($enrollment) => $enrollment->student_id)
            ->mapWithKeys(function ($enrollment): array {
                $studentId = (string) $enrollment->student_id;
                $studentName = $enrollment->relationLoaded('student') && $enrollment->student
                    ? (string) $enrollment->student->name
                    : 'طالب غير معروف';

                return [$studentId => $studentName];
            });
    }
}
