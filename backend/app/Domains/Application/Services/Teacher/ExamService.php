<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Exams\DTOs\TeacherExamData;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\Question;
use App\Domains\Application\Filters\ExamFilter;
use App\Domains\Application\Traits\HasAcademyFilter;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamService
{
    use HasAcademyFilter;

    // Cache for target students to avoid duplicate queries
    private array $targetStudentsCache = [];

    public function getExams(Teacher $teacher, int $perPage = 10, array $filters = [], ?string $academyId = null)
    {
        $query = Exam::where('teacher_id', $teacher->id)
            ->with(['grade', 'group', 'results.student'])
            ->withCount('questions')
            ->orderBy('is_active', 'desc')
            ->latest();

        // Apply filters using Filter class
        (new ExamFilter($filters))->apply($query);

        // Apply academy filter via grade relationship
        if ($academyId === 'independent') {
            $query->whereNull('academy_id')
                ->whereDoesntHave('grade', fn ($q) => $q->whereNotNull('academy_id'))
                ->whereDoesntHave('group', fn ($q) => $q->whereNotNull('academy_id'));
        } elseif ($academyId) {
            $query->where(function ($q) use ($academyId) {
                $q->where('academy_id', $academyId)
                    ->orWhereHas('grade', fn ($g) => $g->where('academy_id', $academyId))
                    ->orWhereHas('group', fn ($gr) => $gr->where('academy_id', $academyId));
            });
        }

        return $query->paginate($perPage);
    }

    public function createExam(Teacher $teacher, TeacherExamData $data): Exam
    {
        return DB::transaction(function () use ($teacher, $data) {
            // Type might not be in DTO if it's legacy, default to manual
            $type = property_exists($data, 'type') ? $data->type : 'manual';
            $dynamicSettings = property_exists($data, 'dynamic_settings') ? $data->dynamic_settings : null;

            $exam = Exam::create([
                'teacher_id' => $teacher->id,
                'academy_id' => $data->academy_id,
                'title' => $data->title,
                'type' => $type,
                'dynamic_settings' => $dynamicSettings,
                'subject' => $data->subject,
                'grade_id' => $data->grade_id,
                'group_id' => $data->group_id,
                'date' => Carbon::parse($data->date, 'Africa/Cairo')->setTimezone('UTC'),
                'duration' => $data->duration,
                'max_score' => $data->total_marks,
                'actual_question_count' => $data->actual_question_count,
                'time_per_question' => $data->time_per_question,
            ]);

            if ($type === 'manual') {
                $questionIds = property_exists($data, 'question_ids') ? $data->question_ids : null;
                $this->syncQuestions($exam, $teacher, $data->questions, $questionIds);
            } elseif ($type === 'dynamic' && !empty($dynamicSettings)) {
                $this->generateDynamicQuestions($exam, $teacher, $dynamicSettings);
            }

            return $exam->load('questions');
        });
    }

    public function updateExam(Exam $exam, TeacherExamData $data): Exam
    {
        return DB::transaction(function () use ($exam, $data) {
            $type = $data->type ?? $exam->type;
            $dynamicSettings = $data->dynamic_settings ?? $exam->dynamic_settings;

            $exam->update([
                'title' => $data->title,
                'type' => $type,
                'dynamic_settings' => $dynamicSettings,
                'subject' => $data->subject,
                'grade_id' => $data->grade_id,
                'group_id' => $data->group_id,
                'date' => Carbon::parse($data->date, 'Africa/Cairo')->setTimezone('UTC'),
                'duration' => $data->duration,
                'max_score' => $data->total_marks,
                'actual_question_count' => $data->actual_question_count,
                'time_per_question' => $data->time_per_question,
            ]);

            if ($type === 'manual') {
                $questionIds = property_exists($data, 'question_ids') ? $data->question_ids : null;
                $this->syncQuestions($exam, $exam->teacher, $data->questions, $questionIds);
            } elseif ($type === 'dynamic') {
                $this->generateDynamicQuestions($exam, $exam->teacher, $dynamicSettings ?? []);
            } else {
                // If it became another type, remove questions
                $exam->questions()->detach();
            }

            return $exam->load('questions');
        });
    }

    /**
     * Generates questions from the question bank for a dynamic exam and syncs them to the pivot table.
     */
    private function generateDynamicQuestions(Exam $exam, Teacher $teacher, array $settings): void
    {
        $pivotData = [];
        $order = 0;

        foreach ($settings as $difficulty => $count) {
            $count = (int) $count;
            if ($count <= 0) {
                continue;
            }

            // Query bank for this teacher, grade, subject & difficulty
            $query = Question::where('teacher_id', $teacher->id)
                ->where('grade_id', $exam->grade_id)
                ->where('subject', $exam->subject)
                ->where('difficulty', $difficulty);

            $totalAvailable = $query->count();
            if ($totalAvailable < $count) {
                $difficultyAr = match ($difficulty) {
                    'easy' => 'السهلة',
                    'medium' => 'المتوسطة',
                    'hard' => 'الصعبة',
                    default => $difficulty
                };
                throw new \Exception("لا يوجد عدد كافٍ من الأسئلة في بنك الأسئلة لمستوى الصعوبة ({$difficultyAr}). المطلوب {$count} والمتاح {$totalAvailable} فقط.");
            }

            $questionIds = $query->inRandomOrder()
                ->limit($count)
                ->pluck('id');

            foreach ($questionIds as $qId) {
                $pivotData[$qId] = ['order' => $order++];
            }
        }

        $exam->questions()->sync($pivotData);
    }

    public function deleteExam(Exam $exam): void
    {
        $exam->delete(); // Cascade handles pivot
    }

    public function copyExam(Exam $exam, ?string $title = null): Exam
    {
        return DB::transaction(function () use ($exam, $title) {
            $newExam = $exam->replicate(['is_active', 'activated_at', 'ended_at', 'created_at', 'updated_at']);
            $newExam->title = $title ?? ($exam->title.' (نسخة)');
            $newExam->save();

            if ($newExam->type === 'manual') {
                // Copy pivot relationships exactly
                $pivotData = [];
                foreach ($exam->questions as $q) {
                    $pivotData[$q->id] = ['order' => $q->pivot->order, 'points' => $q->pivot->points];
                }
                $newExam->questions()->sync($pivotData);
            }

            return $newExam->load('questions');
        });
    }

    /**
     * Sync questions to the exam_question pivot table.
     * Handles both pre-existing question_ids and new question objects that need creation.
     */
    private function syncQuestions(Exam $exam, Teacher $teacher, ?array $questions, ?array $questionIds): void
    {
        $pivotData = [];
        $order = 0;

        // If IDs are provided directly (from Question Bank selection)
        if (!empty($questionIds)) {
            foreach ($questionIds as $qId) {
                $pivotData[$qId] = ['order' => $order++];
            }
        }

        // If new questions are provided as objects (legacy manual creation)
        if (!empty($questions)) {
            $now = now();
            $newQuestionsToInsert = [];
            
            foreach ($questions as $q) {
                if (isset($q['id']) && Question::where('id', $q['id'])->exists()) {
                    // Update existing
                    Question::where('id', $q['id'])->update([
                        'text' => $q['text'],
                        'type' => $q['type'] ?? 'mcq',
                        'options' => json_encode($q['options']),
                        'correct_answer' => $q['correct_answer'],
                        'duration' => $q['duration'] ?? 60,
                        'difficulty' => $q['difficulty'] ?? 'medium',
                    ]);
                    $pivotData[$q['id']] = ['order' => $order++];
                } else {
                    // Insert into Question Bank
                    $newId = Str::uuid()->toString();
                    $newQuestionsToInsert[] = [
                        'id' => $newId,
                        'teacher_id' => $teacher->id,
                        'grade_id' => $exam->grade_id,
                        'subject' => $exam->subject,
                        'exam_id' => $exam->id, // Legacy compat
                        'text' => $q['text'],
                        'type' => $q['type'] ?? 'mcq',
                        'options' => json_encode($q['options']),
                        'correct_answer' => $q['correct_answer'],
                        'duration' => $q['duration'] ?? 60,
                        'difficulty' => $q['difficulty'] ?? 'medium',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $pivotData[$newId] = ['order' => $order++];
                }
            }

            if (!empty($newQuestionsToInsert)) {
                Question::insert($newQuestionsToInsert);
            }
        }

        $exam->questions()->sync($pivotData);
    }

    public function checkActiveConflicts(Exam $exam): ?array
    {
        $targetStudentIds = $this->getTargetStudentIds($exam);

        if (empty($targetStudentIds)) {
            return null;
        }

        $conflictingExams = Exam::where('is_active', true)
            ->where('id', '!=', $exam->id)
            ->where('teacher_id', '!=', $exam->teacher_id)
            ->where('grade_id', $exam->grade_id)
            ->whereHas('teacher', function ($q) use ($targetStudentIds) {
                $q->whereHas('enrollments', function ($eq) use ($targetStudentIds) {
                    $eq->whereIn('student_id', $targetStudentIds)
                        ->where('is_active', true);
                });
            })
            ->with('teacher:id,name')
            ->get();

        if ($conflictingExams->isEmpty()) {
            return null;
        }

        return [
            'has_conflict' => true,
            'conflicting_exams' => $conflictingExams,
            'affected_students_count' => count($targetStudentIds),
        ];
    }

    public function checkDateConflicts(string $gradeId, string $date, string $teacherId, ?string $examId = null): ?array
    {
        $targetStudentIds = Enrollment::where('teacher_id', $teacherId)
            ->where('grade_id', $gradeId)
            ->where('is_active', true)
            ->pluck('student_id')
            ->toArray();

        if (empty($targetStudentIds)) {
            return null;
        }

        $query = Exam::whereDate('date', $date)
            ->where('teacher_id', '!=', $teacherId)
            ->where('grade_id', $gradeId)
            ->whereHas('teacher', function ($q) use ($targetStudentIds) {
                $q->whereHas('enrollments', function ($eq) use ($targetStudentIds) {
                    $eq->whereIn('student_id', $targetStudentIds)
                        ->where('is_active', true);
                });
            })
            ->with('teacher:id,name');

        if ($examId) {
            $query->where('id', '!=', $examId);
        }

        $conflictingExams = $query->get();

        if ($conflictingExams->isEmpty()) {
            return null;
        }

        return [
            'has_conflict' => true,
            'conflicting_exams' => $conflictingExams,
            'affected_students_count' => count($targetStudentIds),
        ];
    }

    private function getTargetStudentIds(Exam $exam): array
    {
        $query = Enrollment::where('teacher_id', $exam->teacher_id)
            ->where('grade_id', $exam->grade_id)
            ->where('is_active', true);

        if ($exam->group_id) {
            $query->where('group_id', $exam->group_id);
        }

        return $query->pluck('student_id')->toArray();
    }

    public function toggleStatus(Exam $exam): array
    {
        $isActive = ! $exam->is_active;

        if ($isActive) {
            $conflict = $this->checkActiveConflicts($exam);

            if ($conflict) {
                $teacherNames = $conflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');

                return [
                    'success' => false,
                    'message' => "لا يمكن تفعيل الامتحان. يوجد امتحان فعال الآن للمدرس: {$teacherNames}. سيؤثر على {$conflict['affected_students_count']} طالب مشترك.",
                    'code' => 409,
                ];
            }
        }

        $updateData = ['is_active' => $isActive];

        if ($isActive) {
            $updateData['activated_at'] = now();
            $updateData['ended_at'] = null;
        }

        $exam->update($updateData);
        $exam->refresh();

        if ($isActive) {
            $this->notifyStudents($exam, new \App\Domains\Exams\Notifications\ExamActivatedNotification($exam));
        }

        $exam->teacher->notify(new \App\Domains\Exams\Notifications\ExamStatusNotification($exam, $isActive ? 'active' : 'inactive'));

        return [
            'success' => true,
            'exam' => $exam,
            'message' => $isActive ? 'تم تفعيل الامتحان بنجاح وإشعار الطلاب' : 'تم إلغاء تفعيل الامتحان بنجاح',
        ];
    }

    public function endExam(Exam $exam): Exam
    {
        if ($exam->ended_at) {
            return $exam;
        }

        $exam->update([
            'is_active' => false,
            'ended_at' => now(),
        ]);

        unset($this->targetStudentsCache[$exam->id]);
        $exam->refresh();

        $exam->teacher->notify(new \App\Domains\Exams\Notifications\ExamStatusNotification($exam, 'ended'));

        $this->processExamResults($exam);

        return $exam;
    }

    public function notifyStudents(Exam $exam, $notification): void
    {
        $students = $this->getTargetStudents($exam);

        if ($students->count() > 0) {
            \Illuminate\Support\Facades\Notification::send($students, $notification);
        }
    }

    public function processExamResults(Exam $exam): void
    {
        $students = $this->getTargetStudents($exam);

        $attempts = $exam->attempts()->get()->keyBy('student_id');

        $examService = app(\App\Domains\Application\Services\Student\StudentExamService::class);
        $absentResults = [];
        $absentStudents = [];

        foreach ($students as $student) {
            $attempt = $attempts->get($student->id);

            if ($attempt) {
                if ($attempt->status === 'in_progress') {
                    $examService->terminateExam($attempt, 'time_limit_exceeded');
                }
            } else {
                $absentResults[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'exam_id' => $exam->id,
                    'student_id' => $student->id,
                    'score' => 0,
                    'percentage' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $absentStudents[] = $student;
            }
        }

        if (! empty($absentResults)) {
            \App\Domains\Exams\Models\ExamResult::insert($absentResults);

            \Illuminate\Support\Facades\Notification::send(
                collect($absentStudents),
                new \App\Domains\Exams\Notifications\ExamAbsentNotification($exam)
            );
        }
    }

    private function getTargetStudents(Exam $exam, bool $refresh = false): \Illuminate\Database\Eloquent\Collection
    {
        $cacheKey = $exam->id;

        if (!$refresh && isset($this->targetStudentsCache[$cacheKey])) {
            return $this->targetStudentsCache[$cacheKey];
        }

        $query = \App\Domains\Auth\Models\Student::select('students.*')
            ->join('enrollments', 'students.id', '=', 'enrollments.student_id')
            ->where('enrollments.teacher_id', $exam->teacher_id)
            ->where('enrollments.is_active', true);

        if ($exam->grade_id) {
            $query->where('enrollments.grade_id', $exam->grade_id);
        }

        if ($exam->group_id) {
            $query->where('enrollments.group_id', $exam->group_id);
        }

        $students = $query->distinct()->get();
        $this->targetStudentsCache[$cacheKey] = $students;

        return $students;
    }
}
