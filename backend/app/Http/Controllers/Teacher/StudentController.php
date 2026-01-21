<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Student\StoreStudentRequest;
use App\Http\Requests\Teacher\Student\UpdatePermissionsRequest;
use App\Http\Requests\Teacher\Student\UpdateStudentRequest;
use App\Http\Resources\Teacher\EnrollmentResource;
use App\Models\Enrollment;
use App\Models\PaymentLog;
use App\Services\Teacher\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    use \App\Traits\ResolvesTeacher;

    public function __construct(
        private StudentService $service
    ) {}

    /**
     * List all students (via enrollments)
     */
    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $status = $request->input('status');
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');

        $enrollments = $this->service->getStudents($teacher, $perPage, $search, $status, $academyId);

        return $this->successResponse([
            'students' => EnrollmentResource::collection($enrollments)->response()->getData(true)
        ]);
    }

    /**
     * Search for existing student by phone (for smart enrollment)
     */
    public function searchByPhone(Request $request): JsonResponse
    {
        $request->validate(['phone' => 'required|string']);
        
        $student = $this->service->searchByPhone($request->input('phone'));
        
        if ($student) {
            // Check if already enrolled with this teacher
            $teacher = $this->getTeacherFromRequest($request);
            $enrollment = Enrollment::where('student_id', $student->id)
                ->where('teacher_id', $teacher->id)
                ->first();
                
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
                'already_enrolled' => $enrollment !== null,
            ]);
        }
        
        return $this->successResponse([
            'found' => false,
            'student' => null,
            'already_enrolled' => false,
        ]);
    }

    /**
     * Create new student or attach existing
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        try {
            $teacher = $this->getTeacherFromRequest($request);
            $validated = $request->validated();

            // Validation for group/grade is handled in StoreStudentRequest

            $result = $this->service->createStudent($teacher, $validated);

            $message = $result['is_new_student'] 
                ? 'تم إضافة الطالب بنجاح'
                : ($result['was_already_enrolled'] 
                    ? 'هذا الطالب مسجل بالفعل'
                    : 'تم ربط الطالب الموجود بصفك بنجاح');

            return $this->successResponse([
                'enrollment' => new EnrollmentResource($result['enrollment']),
                'is_new_student' => $result['is_new_student'],
                'was_already_enrolled' => $result['was_already_enrolled'],
                'message' => $message
            ], 201);
        } catch (\Exception $e) {
            Log::error('Student creation failed: ' . $e->getMessage(), [
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('فشل إضافة الطالب: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Show enrollment details
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        // Find enrollment by student_id
        $enrollment = Enrollment::with(['student', 'grade', 'group'])
            ->where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        // Load student relations for stats
        $enrollment->student->load(['examResults.exam', 'attendances.lecture']);

        $subscriptionHistory = $this->service->getSubscriptionHistory($enrollment);

        // Get raw payment logs for detailed history
        $paymentLogs = PaymentLog::forTeacher($teacher->id)
            ->forStudent($id)
            ->latest()
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'amount' => $log->amount,
                'months' => $log->months,
                'start_date' => $log->start_date?->format('Y-m-d'),
                'end_date' => $log->end_date?->format('Y-m-d'),
                'notes' => $log->notes,
                'confirmation_code' => $log->confirmation_code,
                'payment_method' => $log->payment_method,
                'created_at' => $log->created_at,
            ]);

        return $this->successResponse([
            'student' => new EnrollmentResource($enrollment),
            'subscription_history' => $subscriptionHistory,
            'payment_logs' => $paymentLogs,
        ]);
    }

    /**
     * Update student/enrollment
     */
    public function update(UpdateStudentRequest $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $enrollment = Enrollment::with(['student'])
            ->where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();
            
        $validated = $request->validated();

        // Validation for group/grade is handled in UpdateStudentRequest

        // Update student data (shared)
        $studentData = array_intersect_key($validated, array_flip([
            'name', 'phone', 'parent_phone', 'gender', 'education_type', 'location', 'password'
        ]));
        if (!empty($studentData)) {
            $this->service->updateStudent($enrollment->student, $studentData);
        }

        // Update enrollment data (teacher-specific)
        $enrollmentData = array_intersect_key($validated, array_flip([
            'grade_id', 'group_id', 'balance', 'subscription_start', 'subscription_end', 'teacher_notes'
        ]));
        if (!empty($enrollmentData)) {
            $this->service->updateEnrollment($enrollment, $enrollmentData);
        }

        $enrollment->refresh();
        $enrollment->load(['student', 'grade', 'group']);

        return $this->successResponse([
            'student' => new EnrollmentResource($enrollment),
            'message' => 'تم تحديث بيانات الطالب بنجاح'
        ]);
    }

    /**
     * Remove enrollment (soft delete)
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $enrollment = Enrollment::where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();
        
        $this->service->deleteEnrollment($enrollment);

        return $this->successResponse([
            'message' => 'تم إلغاء تسجيل الطالب بنجاح'
        ]);
    }

    /**
     * Get statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $stats = $this->service->getStatistics($teacher);

        return $this->successResponse($stats);
    }

    /**
     * Update student permissions
     */
    public function updatePermissions(UpdatePermissionsRequest $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $enrollment = Enrollment::with('student')
            ->where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        $enrollment->student->syncPermissions($request->validated()['permissions'] ?? []);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات الطالب بنجاح',
            'permissions' => $enrollment->student->getAllPermissions()->pluck('name'),
        ]);
    }

    /**
     * Toggle enrollment status
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $enrollment = Enrollment::where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        $this->service->toggleStatus($enrollment);

        return $this->successResponse([
            'message' => $enrollment->is_active ? 'تم تفعيل حساب الطالب بنجاح' : 'تم تعطيل حساب الطالب بنجاح',
            'is_active' => $enrollment->is_active
        ]);
    }

    /**
     * Get activation details
     */
    public function activationDetails(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $enrollment = Enrollment::with(['student', 'grade', 'group'])
            ->where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        $details = $this->service->getActivationDetails($enrollment);

        return $this->successResponse($details);
    }

    /**
     * Activate student subscription (1 month)
     */
    public function activate(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $enrollment = Enrollment::where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        $result = $this->service->activate($enrollment, $request->all());

        return $this->successResponse(array_merge(
            ['message' => 'تم تفعيل اشتراك الطالب لمدة شهر بنجاح'],
            $result
        ));
    }
}
