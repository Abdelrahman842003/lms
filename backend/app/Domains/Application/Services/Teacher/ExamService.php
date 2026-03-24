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
        // Apply academy filter
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
            $exam = Exam::create([
                'teacher_id' => $teacher->id,
                'academy_id' => $data->academy_id,
                'title' => $data->title,
                'subject' => $data->subject,
                'grade_id' => $data->grade_id,
                'group_id' => $data->group_id,
                'date' => Carbon::parse($data->date, 'Africa/Cairo')->setTimezone('UTC'),
                'duration' => $data->duration,
                'max_score' => $data->total_marks,
                'actual_question_count' => $data->actual_question_count,
                'time_per_question' => $data->time_per_question,
            ]);

            $this->createQuestions($exam, $data->questions);

            return $exam->load('questions');
        });
    }

    public function updateExam(Exam $exam, TeacherExamData $data): Exam
    {
        return DB::transaction(function () use ($exam, $data) {
            // Standard update
            $exam->update([
                'title' => $data->title,
                'subject' => $data->subject,
                'grade_id' => $data->grade_id,
                'group_id' => $data->group_id,
                'date' => Carbon::parse($data->date, 'Africa/Cairo')->setTimezone('UTC'),
                'duration' => $data->duration,
                'max_score' => $data->total_marks,
                'actual_question_count' => $data->actual_question_count,
                'time_per_question' => $data->time_per_question,
            ]);

            // Sync questions instead of delete+create for better performance
            $this->syncQuestions($exam, $data->questions);

            return $exam->load('questions');
        });
    }

    public function deleteExam(Exam $exam): void
    {
        $exam->delete();
    }

    public function copyExam(Exam $exam, ?string $title = null): Exam
    {
        return DB::transaction(function () use ($exam, $title) {
            $newExam = $exam->replicate(['is_active', 'activated_at', 'ended_at', 'created_at', 'updated_at']);
            $newExam->title = $title ?? ($exam->title.' (نسخة)');
            $newExam->save();

            // Bulk insert questions for better performance
            $now = now();
            $newQuestions = $exam->questions->map(fn($q) => [
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'exam_id' => $newExam->id,
                'text' => $q->text,
                'options' => $q->options,
                'correct_answer' => $q->correct_answer,
                'duration' => $q->duration,
                'created_at' => $now,
                'updated_at' => $now,
            ])->toArray();

            Question::insert($newQuestions);

            return $newExam->load('questions');
        });
    }

    private function createQuestions(Exam $exam, array $questions): void
    {
        $now = now();
        $rows = array_map(fn($q) => [
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'exam_id' => $exam->id,
            'text' => $q['text'],
            'options' => $q['options'],
            'correct_answer' => $q['correct_answer'],
            'duration' => $q['duration'] ?? 60,
            'created_at' => $now,
            'updated_at' => $now,
        ], $questions);

        Question::insert($rows);
    }

    /**
     * مزامنة الأسئلة: تحديث الموجود وإضافة الجديد وحذف المحذوف
     * أكثر كفاءة من delete+create
     */
    private function syncQuestions(Exam $exam, array $questions): void
    {
        $existingIds = Question::where('exam_id', $exam->id)->pluck('id')->toArray();
        $newIds = [];

        foreach ($questions as $index => $q) {
            $questionId = $q['id'] ?? null;

            if ($questionId && in_array($questionId, $existingIds)) {
                // Update existing question
                Question::where('id', $questionId)->update([
                    'text' => $q['text'],
                    'options' => $q['options'],
                    'correct_answer' => $q['correct_answer'],
                    'duration' => $q['duration'] ?? 60,
                    'sort_order' => $index,
                ]);
                $newIds[] = $questionId;
            } else {
                // Create new question
                $newQuestion = Question::create([
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'exam_id' => $exam->id,
                    'text' => $q['text'],
                    'options' => $q['options'],
                    'correct_answer' => $q['correct_answer'],
                    'duration' => $q['duration'] ?? 60,
                    'sort_order' => $index,
                ]);
                $newIds[] = $newQuestion->id;
            }
        }

        // Delete questions that are not in the new list
        $toDelete = array_diff($existingIds, $newIds);
        if (!empty($toDelete)) {
            Question::whereIn('id', $toDelete)->delete();
        }
    }

    /**
     * التحقق من وجود امتحانات فعالة حالياً لنفس الطلاب (للتفعيل)
     */
    public function checkActiveConflicts(Exam $exam): ?array
    {
        $targetStudentIds = $this->getTargetStudentIds($exam);

        if (empty($targetStudentIds)) {
            return null;
        }

        // البحث عن امتحانات فعالة من مدرسين آخرين لنفس الطلاب
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

    /**
     * التحقق من وجود امتحانات في نفس التاريخ لنفس الطلاب (للإنشاء/التحديث)
     */
    public function checkDateConflicts(string $gradeId, string $date, string $teacherId, ?string $examId = null): ?array
    {
        // جلب معرفات الطلاب المشتركين فقط (لا حاجة لتحميل العلاقات)
        $targetStudentIds = Enrollment::where('teacher_id', $teacherId)
            ->where('grade_id', $gradeId)
            ->where('is_active', true)
            ->pluck('student_id')
            ->toArray();

        if (empty($targetStudentIds)) {
            return null;
        }

        // البحث عن امتحانات في نفس التاريخ من مدرسين آخرين
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

    /**
     * جلب معرفات الطلاب المستهدفين بالامتحان
     */
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

        // التحقق من التعارضات قبل التفعيل
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

        // Refresh model to get updated data
        $exam->refresh();

        if ($isActive) {
            // Notify students
            $this->notifyStudents($exam, new \App\Domains\Exams\Notifications\ExamActivatedNotification($exam));
        }

        // Notify teacher for real-time UI update
        $exam->teacher->notify(new \App\Domains\Exams\Notifications\ExamStatusNotification($exam, $isActive ? 'active' : 'inactive'));

        return [
            'success' => true,
            'exam' => $exam,
            'message' => $isActive ? 'تم تفعيل الامتحان بنجاح وإشعار الطلاب' : 'تم إلغاء تفعيل الامتحان بنجاح',
        ];
    }

    public function endExam(Exam $exam): Exam
    {
        // Idempotent behavior: if already ended, return as-is.
        if ($exam->ended_at) {
            return $exam;
        }

        $exam->update([
            'is_active' => false,
            'ended_at' => now(),
        ]);

        // Clear cache for this exam
        unset($this->targetStudentsCache[$exam->id]);

        // Refresh model to get updated data
        $exam->refresh();

        // Notify teacher for real-time UI update
        $exam->teacher->notify(new \App\Domains\Exams\Notifications\ExamStatusNotification($exam, 'ended'));

        // Process results for all students
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

        // Pre-load all attempts for this exam in one query (optimized)
        $attempts = $exam->attempts()->get()->keyBy('student_id');

        $examService = app(\App\Domains\Application\Services\Student\StudentExamService::class);
        $absentResults = [];
        $absentStudents = [];

        foreach ($students as $student) {
            $attempt = $attempts->get($student->id);

            if ($attempt) {
                if ($attempt->status === 'in_progress') {
                    // Force submit
                    $examService->terminateExam($attempt, 'time_limit_exceeded');
                }
            } else {
                // Collect absent students for bulk insert
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

        // Bulk insert absent results
        if (! empty($absentResults)) {
            \App\Domains\Exams\Models\ExamResult::insert($absentResults);

            // Batch notification for absent students
            \Illuminate\Support\Facades\Notification::send(
                collect($absentStudents),
                new \App\Domains\Exams\Notifications\ExamAbsentNotification($exam)
            );
        }
    }

    /**
     * جلب الطلاب المستهدفين بالامتحان (مشترك بين notifyStudents و processExamResults)
     * يستخدم cache لتجنب الاستعلامات المكررة
     */
    private function getTargetStudents(Exam $exam, bool $refresh = false): \Illuminate\Database\Eloquent\Collection
    {
        $cacheKey = $exam->id;

        // Return cached value if available and not forcing refresh
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

        // Cache the result
        $this->targetStudentsCache[$cacheKey] = $students;

        return $students;
    }
}
