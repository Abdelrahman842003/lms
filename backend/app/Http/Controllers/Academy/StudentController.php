<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\DTOs\Academy\StudentData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Academy\Student\StoreStudentRequest;
use App\Http\Requests\Academy\Student\UpdateStudentRequest;
use App\Models\Academy;
use App\Models\Enrollment;
use App\Models\Student;
use App\Services\Academy\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
        if ($user instanceof \App\Models\Secretary) {
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

        // Transform data
        $data = $students->through(function ($student) {
            $enrollments = $student->enrollments;
            
            // Determine best status from all enrollments (priority: active > trial > grace_period > expired)
            $statusPriority = ['active' => 1, 'trial' => 2, 'grace_period' => 3, 'expired' => 4];
            $bestStatus = 'expired';
            $bestDaysLeft = 0;
            $bestTrialDaysLeft = null;
            
            foreach ($enrollments as $enrollment) {
                $enrollmentStatus = $enrollment->status ?? 'expired';
                if (($statusPriority[$enrollmentStatus] ?? 5) < ($statusPriority[$bestStatus] ?? 5)) {
                    $bestStatus = $enrollmentStatus;
                    $bestDaysLeft = $enrollment->days_left ?? 0;
                    if ($enrollmentStatus === 'trial' && $enrollment->trial_ends_at) {
                        $bestTrialDaysLeft = max(0, now()->diffInDays($enrollment->trial_ends_at, false));
                    }
                }
            }
            
            return [
                'id' => $student->id,
                'name' => $student->name,
                'phone' => $student->phone,
                'parent_phone' => $student->parent_phone,
                'avatar' => $student->avatar,
                'is_active' => $enrollments->contains('is_active', true),
                'status' => $bestStatus,
                'days_left' => $bestDaysLeft,
                'trial_days_left' => $bestTrialDaysLeft,
                'teachers_count' => $enrollments->unique('teacher_id')->count(),
                'teachers' => $enrollments->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->teacher_id,
                        'name' => $enrollment->teacher?->name,
                        'grade_name' => $enrollment->grade?->name,
                        'group_name' => $enrollment->group?->name,
                        'is_active' => $enrollment->is_active,
                        'subscription_end' => $enrollment->subscription_end,
                        'status' => $enrollment->status,
                        'days_left' => $enrollment->days_left,
                        'trial_ends_at' => $enrollment->trial_ends_at,
                        'trial_days_left' => $enrollment->status === 'trial' && $enrollment->trial_ends_at
                            ? max(0, now()->diffInDays($enrollment->trial_ends_at, false))
                            : null,
                    ];
                })->values(),
                'group_name' => $enrollments->pluck('group.name')->filter()->unique()->implode(', '),
                'grade_name' => $enrollments->pluck('grade.name')->filter()->unique()->implode(', '),
                'created_at' => $student->created_at,
                'remaining_days' => $enrollments->where('is_active', true)
                    ->filter(fn($e) => $e->subscription_end && $e->subscription_end->isFuture())
                    ->map(fn($e) => now()->diffInDays($e->subscription_end))
                    ->max() ?? 0,
            ];
        });

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

        $history = \App\Models\PaymentLog::where('student_id', $student->id)
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

        \Illuminate\Support\Facades\Log::info('Toggle Status Debug', [
            'academy_id' => $academy->id,
            'id_param' => $id,
            'teacher_id_param' => $request->teacher_id,
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings(),
        ]);

        $enrollment = $query->first();

        if (!$enrollment) {
            \Illuminate\Support\Facades\Log::warning('Enrollment not found for toggle status');
            return $this->errorResponse('Student not found or not linked to this teacher', 404);
        }

        $enrollment = $this->service->toggleStatus($enrollment);

        return $this->successResponse([
            'is_active' => $enrollment->is_active,
            'teacher_id' => $enrollment->teacher_id,
        ], $enrollment->is_active ? 'تم تفعيل حساب الطالب بنجاح' : 'تم تعطيل حساب الطالب بنجاح');
    }

    public function searchByPhone(Request $request): JsonResponse
    {
        $request->validate(['phone' => 'required|string']);

        $student = Student::findByPhone($request->phone);

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
