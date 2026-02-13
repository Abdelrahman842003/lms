<?php

declare(strict_types=1);

namespace App\Services\Teacher;

use App\DTOs\Teacher\ExamData;
use App\Models\Exam;
use App\Models\Enrollment;
use App\Models\Question;
use App\Models\Teacher;
use App\Traits\HasAcademyFilter;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ExamService
{
    use HasAcademyFilter;

    public function getExams(Teacher $teacher, int $perPage = 10, array $filters = [], ?string $academyId = null)
    {
        $query = Exam::where('teacher_id', $teacher->id)
            ->with(['grade', 'group', 'results.student'])
            ->withCount('questions')
            ->orderBy('is_active', 'desc')
            ->latest()
            ->filter($filters);

        // Apply academy filter via grade relationship
        // Apply academy filter
        if ($academyId === 'independent') {
            $query->whereNull('academy_id')
                  ->whereDoesntHave('grade', fn($q) => $q->whereNotNull('academy_id'))
                  ->whereDoesntHave('group', fn($q) => $q->whereNotNull('academy_id'));
        } elseif ($academyId) {
            $query->where(function($q) use ($academyId) {
                $q->where('academy_id', $academyId)
                  ->orWhereHas('grade', fn($g) => $g->where('academy_id', $academyId))
                  ->orWhereHas('group', fn($gr) => $gr->where('academy_id', $academyId));
            });
        }

        return $query->paginate($perPage);
    }

    public function createExam(Teacher $teacher, ExamData $data): Exam
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

    public function updateExam(Exam $exam, ExamData $data): Exam
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

            $exam->questions()->delete();
            $this->createQuestions($exam, $data->questions);

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
            $newExam->title = $title ?? ($exam->title . ' (نسخة)');
            $newExam->save();

            foreach ($exam->questions as $question) {
                $newQuestion = $question->replicate(['exam_id', 'created_at', 'updated_at']);
                $newQuestion->exam_id = $newExam->id;
                $newQuestion->save();
            }

            return $newExam->load('questions');
        });
    }

    private function createQuestions(Exam $exam, array $questions): void
    {
        foreach ($questions as $q) {
            Question::create([
                'exam_id' => $exam->id,
                'text' => $q['text'],
                'options' => $q['options'],
                'correct_answer' => $q['correct_answer'],
                'duration' => $q['duration'] ?? 60,
            ]);
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
        // جلب الطلاب المشتركين عند هذا المدرس في هذا الصف
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
        $isActive = !$exam->is_active;
        
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
                    'code' => 409
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
            $this->notifyStudents($exam, new \App\Notifications\ExamActivatedNotification($exam));
        }
        
        // Notify teacher for real-time UI update
        $exam->teacher->notify(new \App\Notifications\ExamStatusNotification($exam, $isActive ? 'active' : 'inactive'));

        return [
            'success' => true,
            'exam' => $exam,
            'message' => $isActive ? 'تم تفعيل الامتحان بنجاح وإشعار الطلاب' : 'تم إلغاء تفعيل الامتحان بنجاح'
        ];
    }

    public function endExam(Exam $exam): Exam
    {
        if (!$exam->is_active) {
            throw new \Exception('الامتحان غير مفعل بالفعل');
        }

        $exam->update([
            'is_active' => false,
            'ended_at' => now()
        ]);
        
        // Refresh model to get updated data
        $exam->refresh();
        
        // Notify teacher for real-time UI update
        $exam->teacher->notify(new \App\Notifications\ExamStatusNotification($exam, 'ended'));

        // Process results for all students
        $this->processExamResults($exam);

        return $exam;
    }

    public function notifyStudents(Exam $exam, $notification): void
    {
        $query = \App\Models\Student::whereHas('enrollments', function ($q) use ($exam) {
            $q->where('teacher_id', $exam->teacher_id);
        });

        if ($exam->grade_id) {
            $query->whereHas('enrollments', function ($q) use ($exam) {
                $q->where('grade_id', $exam->grade_id);
            });
        }

        if ($exam->group_id) {
            $query->whereHas('enrollments', function ($q) use ($exam) {
                $q->where('group_id', $exam->group_id);
            });
        }

        $students = $query->get();
        
        if ($students->count() > 0) {
            \Illuminate\Support\Facades\Notification::send($students, $notification);
        }
    }

    public function processExamResults(Exam $exam): void
    {
        // Get all eligible students
        $query = \App\Models\Student::whereHas('enrollments', function ($q) use ($exam) {
            $q->where('teacher_id', $exam->teacher_id);
        });

        if ($exam->grade_id) {
            $query->whereHas('enrollments', function ($q) use ($exam) {
                $q->where('grade_id', $exam->grade_id);
            });
        }

        if ($exam->group_id) {
            $query->whereHas('enrollments', function ($q) use ($exam) {
                $q->where('group_id', $exam->group_id);
            });
        }

        $students = $query->get();
        
        // Pre-load all attempts for this exam in one query (optimized)
        $attempts = $exam->attempts()->get()->keyBy('student_id');
        
        $examService = app(\App\Services\Student\StudentExamService::class);
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
                    'status' => 'absent',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $absentStudents[] = $student;
            }
        }

        // Bulk insert absent results
        if (!empty($absentResults)) {
            \App\Models\ExamResult::insert($absentResults);
            
            // Batch notification for absent students
            \Illuminate\Support\Facades\Notification::send(
                collect($absentStudents),
                new \App\Notifications\ExamAbsentNotification($exam)
            );
        }
    }
}

