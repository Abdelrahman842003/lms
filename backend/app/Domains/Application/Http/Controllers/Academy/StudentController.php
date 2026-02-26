<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Auth\DTOs\StudentData;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Student\SearchByPhoneRequest;
use App\Domains\Application\Http\Requests\Academy\Student\StoreStudentRequest;
use App\Domains\Application\Http\Requests\Academy\Student\UpdateStudentRequest;
use App\Domains\Application\Http\Resources\Academy\AcademyStudentResource;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Student;
use App\Domains\Application\Services\Academy\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    public function __construct(
        private StudentService $service
    ) {}

    /**
     * Get the academy from the authenticated user or secretary
     */
    protected function getAcademy(Request $request): ?Academy
    {
        $user = Auth::user();
        
        if ($user instanceof Academy) {
            return $user;
        }
        
        // Secretary case - get academy via relationship
        if ($user instanceof \App\Domains\Auth\Models\Secretary) {
            return $user->academies()->first();
        }
        
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'status']);
        
        $students = $this->service->getStudents($academy, $filters, $perPage);
        $data = $students->through(fn ($student) => (new AcademyStudentResource($student))->toArray($request));

        return $this->successResponse($data);
    }

    public function statistics(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $stats = $this->service->getStatistics($academy);

        return $this->successResponse($stats);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');

        // Find student - $id could be student_id or enrollment_id
        $student = Student::find($id);
        if (!$student) {
            // Try to find by enrollment_id
            $enrollment = Enrollment::find($id);
            if ($enrollment) {
                $student = $enrollment->student;
            }
        }

        if (!$student) {
            return $this->errorResponse('Student not found', 404);
        }

        // Get all enrollments for this student within this academy
        $enrollments = Enrollment::with(['grade', 'group', 'teacher'])
            ->where('student_id', $student->id)
            ->where('academy_id', $academy->id)
            ->get();

        if ($enrollments->isEmpty()) {
            return $this->errorResponse('Student not found in this academy', 404);
        }

        // Get enrolled teachers with their prices
        $enrolledTeachers = $enrollments->map(function ($enrollment) {
            return [
                'id' => $enrollment->teacher_id,
                'name' => $enrollment->teacher?->name,
                'grade_id' => $enrollment->grade_id,
                'grade_name' => $enrollment->grade?->name,
                'grade_price' => $enrollment->grade?->price ?? 0,
                'group_id' => $enrollment->group_id,
                'group_name' => $enrollment->group?->name,
                'group_price' => $enrollment->group?->price ?? 0,
                'is_active' => $enrollment->is_active,
                'subscription_end' => $enrollment->subscription_end,
            ];
        });

        $history = \App\Domains\Subscriptions\Models\PaymentLog::where('student_id', $student->id)
            ->with(['teacher:id,name'])
            ->latest()
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'amount' => $log->amount,
                    'months' => $log->months,
                    'created_at' => $log->created_at,
                    'payment_method' => $log->payment_method,
                    'confirmation_code' => $log->confirmation_code,
                    'start_date' => $log->start_date,
                    'end_date' => $log->end_date,
                    'teacher' => $log->teacher ? [
                        'id' => $log->teacher->id,
                        'name' => $log->teacher->name,
                    ] : null,
                    'notes' => $log->notes,
                ];
            });

        return $this->successResponse([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'phone' => $student->phone,
                'parent_phone' => $student->parent_phone,
                'gender' => $student->gender,
                'location' => $student->location,
                'education_type' => $student->education_type,
            ],
            'enrolled_teachers' => $enrolledTeachers,
            'subscription_history' => $history,
        ]);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = StudentData::fromRequest($request);
        
        try {
            $result = $this->service->createStudent($academy, $data);

            return $this->successResponse([
                'student' => $result['student'],
                'enrollment' => $result['enrollment'],
                'is_new_student' => $result['is_new_student'],
            ], $result['is_new_student'] ? 'تم إضافة الطالب بنجاح' : 'تم ربط الطالب بنجاح', 201);
        } catch (\Exception $e) {
            Log::error('Create Student Error: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function update(UpdateStudentRequest $request, string $id): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');

        // Find the enrollment (id could be enrollment_id)
        $enrollment = Enrollment::with('student')
            ->whereIn('teacher_id', $teacherIds)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('student_id', $id);
            })
            ->first();

        if (!$enrollment) {
            return $this->errorResponse('Student not found', 404);
        }

        $data = StudentData::fromRequest($request);
        $result = $this->service->updateStudent($academy, $enrollment, $data);

        return $this->successResponse([
            'student' => $result['student'],
            'enrollment' => $result['enrollment'],
        ], 'تم تحديث بيانات الطالب بنجاح');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');

        $enrollment = Enrollment::whereIn('teacher_id', $teacherIds)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('student_id', $id);
            })
            ->first();

        if (!$enrollment) {
            return $this->errorResponse('Student not found', 404);
        }

        $this->service->deleteEnrollment($enrollment);

        return $this->successResponse(null, 'تم إلغاء تسجيل الطالب بنجاح');
    }

    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $query = Enrollment::where('academy_id', $academy->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('student_id', $id);
            });

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        Log::info('Toggle Status Debug', [
            'academy_id' => $academy->id,
            'id_param' => $id,
            'teacher_id_param' => $request->teacher_id,
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings(),
        ]);

        $enrollment = $query->first();

        if (!$enrollment) {
            Log::warning('Enrollment not found for toggle status');
            return $this->errorResponse('Student not found or not linked to this teacher', 404);
        }

        $enrollment = $this->service->toggleStatus($enrollment);

        return $this->successResponse([
            'is_active' => $enrollment->is_active,
            'teacher_id' => $enrollment->teacher_id,
        ], $enrollment->is_active ? 'تم تفعيل حساب الطالب بنجاح' : 'تم تعطيل حساب الطالب بنجاح');
    }

    public function searchByPhone(SearchByPhoneRequest $request): JsonResponse
    {
        $student = Student::findByPhone($request->validated()['phone']);

        if ($student) {
            return $this->successResponse([
                'found' => true,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'phone' => $student->phone,
                    'parent_phone' => $student->parent_phone,
                    'gender' => $student->gender,
                    'education_type' => $student->education_type,
                    'location' => $student->location,
                ],
            ], 'Student found');
        }

        return $this->successResponse([
            'found' => false,
            'student' => null,
        ], 'Student not found');
    }
}
