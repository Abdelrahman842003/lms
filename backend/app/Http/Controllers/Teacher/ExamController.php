<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Exam\StoreExamRequest;
use App\Http\Requests\Teacher\Exam\UpdateExamRequest;
use App\Models\Exam;
use App\Services\Teacher\ExamService;
use App\Http\Resources\Teacher\ExamResource;
use App\Http\Resources\Teacher\ExamResultDetailResource;
use Illuminate\Support\Facades\Auth;

class ExamController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    protected $examService;

    public function __construct(ExamService $examService)
    {
        $this->examService = $examService;
    }

    public function results(Exam $exam)
    {
        try {
            if ($exam->teacher_id !== $this->getTeacherFromRequest(request())->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            // فقط الطلاب الذين حضروا (لديهم attempt_id)
            $results = $exam->results()
                ->whereNotNull('attempt_id')
                ->with(['student'])
                ->get();

            return $this->successResponse([
                'exam' => [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'subject' => $exam->subject,
                    'max_score' => $exam->max_score,
                    'date' => $exam->date,
                    'duration' => $exam->duration,
                ],
                'results' => ExamResultDetailResource::collection($results)
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching exam results: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return $this->errorResponse('An error occurred while fetching results', 500);
        }
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to']);
        $exams = $this->examService->getExams($this->getTeacherFromRequest(request()), $perPage, $filters);

        return $this->successResponse(
            \App\Http\Resources\Teacher\ExamResource::collection($exams)->response()->getData(true)
        );
    }

    public function store(StoreExamRequest $request)
    {
        try {
            $teacher = $this->getTeacherFromRequest(request());
            $data = $request->validated();
            
            // التحقق من تعارض التواريخ كتحذير مبكر
            $warning = null;
            $dateConflict = $this->examService->checkDateConflicts(
                $data['grade_id'],
                $data['date'],
                $teacher->id
            );
            
            if ($dateConflict) {
                $teacherNames = $dateConflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                $warning = "تنبيه: يوجد امتحان في نفس التاريخ للمدرس: {$teacherNames}. قد يؤثر على {$dateConflict['affected_students_count']} طالب مشترك.";
            }
            
            $exam = $this->examService->createExam($teacher, $data);

            $response = [
                'exam' => $exam
            ];
            
            if ($warning) {
                $response['warning'] = $warning;
            }

            return $this->successResponse($response, 'تم إنشاء الامتحان بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create exam: ' . $e->getMessage(), 500);
        }
    }

    public function show(Exam $exam)
    {
        if ($exam->teacher_id !== $this->getTeacherFromRequest(request())->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'exam' => $exam->load(['questions', 'grade', 'group'])
        ]);
    }

    public function update(UpdateExamRequest $request, Exam $exam)
    {
        $teacher = $this->getTeacherFromRequest(request());
        
        if ($exam->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $data = $request->validated();
            
            // التحقق من تعارض التواريخ كتحذير مبكر
            $warning = null;
            $dateConflict = $this->examService->checkDateConflicts(
                $data['grade_id'],
                $data['date'],
                $teacher->id,
                $exam->id
            );
            
            if ($dateConflict) {
                $teacherNames = $dateConflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                $warning = "تنبيه: يوجد امتحان في نفس التاريخ للمدرس: {$teacherNames}. قد يؤثر على {$dateConflict['affected_students_count']} طالب مشترك.";
            }
            
            $exam = $this->examService->updateExam($exam, $data);

            $response = [
                'exam' => $exam
            ];
            
            if ($warning) {
                $response['warning'] = $warning;
            }

            return $this->successResponse($response, 'تم تحديث الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update exam: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Exam $exam)
    {
        $this->examService->deleteExam($exam);
        return $this->successResponse(null, 'تم حذف الامتحان بنجاح');
    }

    public function copy(Exam $exam)
    {
        if ($exam->teacher_id !== $this->getTeacherFromRequest(request())->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $newExam = $this->examService->copyExam($exam);
            return $this->successResponse(['exam' => $newExam], 'تم نسخ الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to copy exam: ' . $e->getMessage(), 500);
        }
    }

    public function toggleStatus(Exam $exam)
    {
        $isActive = !$exam->is_active;
        
        // التحقق من التعارضات قبل التفعيل
        if ($isActive) {
            $conflict = $this->examService->checkActiveConflicts($exam);
            
            if ($conflict) {
                $teacherNames = $conflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                    
                return $this->errorResponse(
                    "لا يمكن تفعيل الامتحان. يوجد امتحان فعال الآن للمدرس: {$teacherNames}. سيؤثر على {$conflict['affected_students_count']} طالب مشترك.",
                    409
                );
            }
        }
        
        $updateData = ['is_active' => $isActive];
        
        if ($isActive) {
            $updateData['activated_at'] = now();
            $updateData['ended_at'] = null;
        }

        $exam->update($updateData);

        if ($isActive) {
            // Notify students
            $this->notifyStudents($exam, new \App\Notifications\ExamActivatedNotification($exam));
        }

        return $this->successResponse(
            new ExamResource($exam),
            $isActive ? 'تم تفعيل الامتحان بنجاح وإشعار الطلاب' : 'تم إلغاء تفعيل الامتحان بنجاح'
        );
    }

    public function endExam(Exam $exam)
    {
        if (!$exam->is_active) {
            return $this->errorResponse('الامتحان غير مفعل بالفعل', 400);
        }

        $exam->update([
            'is_active' => false,
            'ended_at' => now()
        ]);

        // Process results for all students
        $this->processExamResults($exam);

        return $this->successResponse(
            new ExamResource($exam),
            'تم إنهاء الامتحان بنجاح واحتساب النتائج'
        );
    }

    private function notifyStudents(Exam $exam, $notification)
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

    private function processExamResults(Exam $exam)
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

        $students = $query->get();
        $examService = app(\App\Services\Student\StudentExamService::class);

        foreach ($students as $student) {
            $attempt = $exam->attempts()->where('student_id', $student->id)->first();

            if ($attempt) {
                if ($attempt->status === 'in_progress') {
                    // Force submit
                    $examService->terminateExam($attempt, 'time_limit_exceeded');
                }
            } else {
                // Mark as absent
                \App\Models\ExamResult::create([
                    'exam_id' => $exam->id,
                    'student_id' => $student->id,
                    'score' => 0,
                    'percentage' => 0,
                    'status' => 'absent'
                ]);

                $student->notify(new \App\Notifications\ExamAbsentNotification($exam));
            }
        }
    }
}
