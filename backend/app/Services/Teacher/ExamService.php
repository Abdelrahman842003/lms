<?php

namespace App\Services\Teacher;

use App\Models\Exam;
use App\Models\Enrollment;
use App\Models\Question;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class ExamService
{
    public function getExams(Teacher $teacher, int $perPage = 10, array $filters = [])
    {
        return Exam::where('teacher_id', $teacher->id)
            ->with(['grade', 'group', 'results.student'])
            ->orderBy('is_active', 'desc')
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
    }

    public function createExam(Teacher $teacher, array $data): Exam
    {
        return DB::transaction(function () use ($teacher, $data) {
            $exam = Exam::create([
                'teacher_id' => $teacher->id,
                'title' => $data['title'],
                'subject' => $data['subject'],
                'grade_id' => $data['grade_id'],
                'date' => $data['date'],
                'duration' => $data['duration'],
                'max_score' => $data['total_marks'],
                'actual_question_count' => $data['actual_question_count'],
                'time_per_question' => $data['time_per_question'],
            ]);

            $this->createQuestions($exam, $data['questions']);

            return $exam->load('questions');
        });
    }

    public function updateExam(Exam $exam, array $data): Exam
    {
        return DB::transaction(function () use ($exam, $data) {
            $exam->update([
                'title' => $data['title'],
                'subject' => $data['subject'],
                'grade_id' => $data['grade_id'],
                'date' => $data['date'],
                'duration' => $data['duration'],
                'max_score' => $data['total_marks'],
                'actual_question_count' => $data['actual_question_count'],
                'time_per_question' => $data['time_per_question'],
            ]);

            $exam->questions()->delete();
            $this->createQuestions($exam, $data['questions']);

            return $exam->load('questions');
        });
    }

    public function deleteExam(Exam $exam): void
    {
        $exam->delete();
    }

    private function createQuestions(Exam $exam, array $questions): void
    {
        foreach ($questions as $q) {
            Question::create([
                'exam_id' => $exam->id,
                'text' => $q['text'],
                'options' => $q['options'],
                'correct_answer' => $q['correct_answer'],
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
}

