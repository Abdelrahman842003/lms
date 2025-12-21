<?php

namespace App\Http\Controllers\Teacher;

use App\Actions\Teacher\GenerateStudentPassword;
use App\Actions\Teacher\ValidateGroupGrade;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Student\StoreStudentRequest;
use App\Http\Requests\Teacher\Student\UpdateStudentRequest;
use App\Http\Requests\Teacher\Student\UpdatePermissionsRequest;
use App\Http\Resources\Teacher\EnrollmentResource;
use App\Models\Enrollment;
use App\Models\Student;
use App\Services\Teacher\StudentService;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    protected $studentService;
    protected $generatePassword;
    protected $validateGroupGrade;

    public function __construct(
        StudentService $studentService,
        GenerateStudentPassword $generatePassword,
        ValidateGroupGrade $validateGroupGrade
    ) {
        $this->studentService = $studentService;
        $this->generatePassword = $generatePassword;
        $this->validateGroupGrade = $validateGroupGrade;
    }

    /**
     * List all students (via enrollments)
     */
    public function index(Request $request)
    {
        $teacher = $request->user();
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $status = $request->input('status');

        $enrollments = $this->studentService->getStudents($teacher, $perPage, $search, $status);

        return $this->successResponse([
            'students' => EnrollmentResource::collection($enrollments)->response()->getData(true)
        ]);
    }

    /**
     * Search for existing student by phone (for smart enrollment)
     */
    public function searchByPhone(Request $request)
    {
        $request->validate(['phone' => 'required|string']);
        
        $student = $this->studentService->searchByPhone($request->phone);
        
        if ($student) {
            // Check if already enrolled with this teacher
            $teacher = $request->user();
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
    public function store(StoreStudentRequest $request)
    {
        try {
            $teacher = $request->user();
            $validated = $request->validated();

            if (!$this->validateGroupGrade->execute($validated['group_id'] ?? null, $validated['grade_id'] ?? null)) {
                return $this->errorResponse('المجموعة المختارة لا تنتمي للصف الدراسي المحدد', 422);
            }

            // Password is now provided by the frontend for new students
            // For existing students, password is not required/used
            
            $result = $this->studentService->createStudent($teacher, $validated);

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
            \Log::error('Student creation failed: ' . $e->getMessage(), [
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
    public function show(string $id)
    {
        $teacher = request()->user();
        
        // Find enrollment by student_id
        $enrollment = Enrollment::with(['student', 'grade', 'group'])
            ->where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        // Load student relations for stats
        $enrollment->student->load(['examResults.exam', 'attendances.lecture']);

        return $this->successResponse([
            'student' => new EnrollmentResource($enrollment)
        ]);
    }

    /**
     * Update student/enrollment
     */
    public function update(UpdateStudentRequest $request, string $id)
    {
        $teacher = $request->user();
        
        $enrollment = Enrollment::with(['student'])
            ->where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();
            
        $validated = $request->validated();

        $gradeId = $validated['grade_id'] ?? $enrollment->grade_id;
        if (!$this->validateGroupGrade->execute($validated['group_id'] ?? null, $gradeId)) {
            return $this->errorResponse('المجموعة المختارة لا تنتمي للصف الدراسي المحدد', 422);
        }

        // Update student data (shared)
        $studentData = array_intersect_key($validated, array_flip([
            'name', 'phone', 'parent_phone', 'gender', 'education_type', 'location', 'password'
        ]));
        if (!empty($studentData)) {
            $this->studentService->updateStudent($enrollment->student, $studentData);
        }

        // Update enrollment data (teacher-specific)
        $enrollmentData = array_intersect_key($validated, array_flip([
            'grade_id', 'group_id', 'balance', 'subscription_start', 'subscription_end', 'teacher_notes'
        ]));
        if (!empty($enrollmentData)) {
            $this->studentService->updateEnrollment($enrollment, $enrollmentData);
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
    public function destroy(string $id)
    {
        $teacher = request()->user();
        
        $enrollment = Enrollment::where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();
        
        $this->studentService->deleteEnrollment($enrollment);

        return $this->successResponse([
            'message' => 'تم إلغاء تسجيل الطالب بنجاح'
        ]);
    }

    /**
     * Get statistics
     */
    public function statistics(Request $request)
    {
        $teacher = $request->user();
        $stats = $this->studentService->getStatistics($teacher);

        return $this->successResponse($stats);
    }

    /**
     * Update student permissions
     */
    public function updatePermissions(UpdatePermissionsRequest $request, string $id)
    {
        $teacher = $request->user();
        
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
    public function toggleStatus(Request $request, string $id)
    {
        $teacher = $request->user();
        
        $enrollment = Enrollment::where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        $this->studentService->toggleStatus($enrollment);

        return $this->successResponse([
            'message' => $enrollment->is_active ? 'تم تفعيل حساب الطالب بنجاح' : 'تم تعطيل حساب الطالب بنجاح',
            'is_active' => $enrollment->is_active
        ]);
    }

    /**
     * Activate student subscription (1 month)
     */
    public function activate(Request $request, string $id)
    {
        $teacher = $request->user();
        
        $enrollment = Enrollment::where('teacher_id', $teacher->id)
            ->where('student_id', $id)
            ->firstOrFail();

        $startDate = now();
        $endDate = now()->addDays(30);

        $this->studentService->updateEnrollment($enrollment, [
            'is_active' => true,
            'subscription_start' => $startDate,
            'subscription_end' => $endDate,
        ]);

        return $this->successResponse([
            'message' => 'تم تفعيل اشتراك الطالب لمدة شهر بنجاح',
            'subscription_end' => $endDate->format('Y-m-d'),
            'status' => 'active',
            'days_left' => 30
        ]);
    }
}
