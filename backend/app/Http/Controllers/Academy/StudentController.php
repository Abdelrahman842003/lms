<?php

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Models\Academy;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\Grade;
use App\Models\Group;
use App\Services\Teacher\StudentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    protected $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    /**
     * Get the academy from the authenticated user or secretary
     */
    protected function getAcademy(Request $request): ?Academy
    {
        $user = $request->user();
        
        if ($user instanceof Academy) {
            return $user;
        }
        
        // Secretary case - get academy via relationship
        if ($user instanceof \App\Models\Secretary) {
            return $user->academies()->first();
        }
        
        return null;
    }

    /**
     * List all students enrolled with teachers in this academy
     */
    public function index(Request $request)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
        }

        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $status = $request->input('status');

        // Get unique students who have enrollments with teachers in this academy
        $query = Student::whereHas('enrollments', function ($q) use ($academy, $status) {
            $q->whereHas('teacher', function ($t) use ($academy) {
                $t->whereHas('academies', function ($a) use ($academy) {
                    $a->where('academy_id', $academy->id);
                });
            });
            
            if ($status === 'active') {
                $q->where('is_active', true);
            } elseif ($status === 'inactive') {
                $q->where('is_active', false);
            }
        })
        ->with(['enrollments' => function ($q) use ($academy) {
            $q->whereHas('teacher', function ($t) use ($academy) {
                $t->whereHas('academies', function ($a) use ($academy) {
                    $a->where('academy_id', $academy->id);
                });
            })
            ->with(['teacher', 'grade', 'group']);
        }]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $students = $query->latest()->paginate($perPage);

        // Transform data
        $data = $students->through(function ($student) {
            $enrollments = $student->enrollments;
            
            return [
                'id' => $student->id,
                'name' => $student->name,
                'phone' => $student->phone,
                'parent_phone' => $student->parent_phone,
                'avatar' => $student->avatar,
                'is_active' => $enrollments->contains('is_active', true),
                'teachers_count' => $enrollments->unique('teacher_id')->count(),
                'teachers' => $enrollments->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->teacher_id,
                        'name' => $enrollment->teacher?->name,
                        'grade_name' => $enrollment->grade?->name,
                        'group_name' => $enrollment->group?->name,
                        'is_active' => $enrollment->is_active,
                    ];
                })->values(),
                'group_name' => $enrollments->pluck('group.name')->filter()->unique()->implode(', '),
                'grade_name' => $enrollments->pluck('grade.name')->filter()->unique()->implode(', '),
                'created_at' => $student->created_at,
            ];
        });

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'Success',
            'data' => $data,
        ]);
    }

    /**
     * Get statistics for academy students
     */
    public function statistics(Request $request)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
        }

        // Build base query for enrollments with teachers belonging to this academy
        $baseQuery = function () use ($academy) {
            return Enrollment::whereHas('teacher', function ($q) use ($academy) {
                $q->whereHas('academies', function ($q2) use ($academy) {
                    $q2->where('academy_id', $academy->id);
                });
            });
        };

        $totalEnrollments = $baseQuery()->count();
        $activeEnrollments = $baseQuery()->where('is_active', true)->count();
        $inactiveEnrollments = $baseQuery()->where('is_active', false)->count();

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'Success',
            'data' => [
                'total_enrollments' => $totalEnrollments,
                'active_enrollments' => $activeEnrollments,
                'inactive_enrollments' => $inactiveEnrollments,
            ],
        ]);
    }

    /**
     * Get student details
     */
    public function show(Request $request, string $id)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
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
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => 'Student not found',
                'data' => null,
            ], 404);
        }

        // Get all enrollments for this student within this academy
        $enrollments = Enrollment::with(['grade', 'group', 'teacher'])
            ->where('student_id', $student->id)
            ->whereIn('teacher_id', $teacherIds)
            ->get();

        if ($enrollments->isEmpty()) {
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => 'Student not found in this academy',
                'data' => null,
            ], 404);
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
            ];
        });

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'Success',
            'data' => [
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
                'subscription_history' => [],
            ],
        ]);
    }

    /**
     * Create new student
     */
    public function store(Request $request)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'parent_phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6', // Made optional for linking existing students
            'teacher_id' => 'required|exists:teachers,id',
            'grade_id' => 'nullable|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'gender' => 'nullable|in:male,female',
            'education_type' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        // Verify teacher belongs to academy
        $teacherIds = $academy->activeTeachers()->pluck('teachers.id')->toArray();
        if (!in_array($request->teacher_id, $teacherIds)) {
            return response()->json([
                'status' => false,
                'status_code' => 422,
                'message' => 'Teacher not part of this academy',
                'data' => null,
            ], 422);
        }

        $teacher = \App\Models\Teacher::find($request->teacher_id);
        $result = $this->studentService->createStudent($teacher, $request->all());

        return response()->json([
            'status' => true,
            'status_code' => 201,
            'message' => $result['is_new_student'] ? 'تم إضافة الطالب بنجاح' : 'تم ربط الطالب بنجاح',
            'data' => [
                'student' => $result['student'],
                'enrollment' => $result['enrollment'],
                'is_new_student' => $result['is_new_student'],
            ],
        ], 201);
    }

    /**
     * Update student
     */
    public function update(Request $request, string $id)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
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
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => 'Student not found',
                'data' => null,
            ], 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'parent_phone' => 'sometimes|nullable|string|max:20',
            'password' => 'sometimes|nullable|string|min:6',
            'grade_id' => 'sometimes|nullable|uuid|exists:grades,id',
            'group_id' => 'sometimes|nullable|uuid|exists:groups,id',
            'gender' => 'sometimes|nullable|in:male,female',
            'education_type' => 'sometimes|nullable|string',
            'location' => 'sometimes|nullable|string',
        ]);

        // Update student data
        $studentData = $request->only(['name', 'phone', 'parent_phone', 'gender', 'education_type', 'location']);
        if ($request->has('password') && $request->password) {
            $studentData['password'] = Hash::make($request->password);
        }
        $enrollment->student->update($studentData);

        // Update enrollment data
        $enrollmentData = $request->only(['grade_id', 'group_id']);
        if (!empty($enrollmentData)) {
            $enrollment->update($enrollmentData);
        }

        $enrollment->refresh();
        $enrollment->load(['student', 'grade', 'group']);

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'تم تحديث بيانات الطالب بنجاح',
            'data' => [
                'student' => $enrollment->student,
                'enrollment' => $enrollment,
            ],
        ]);
    }

    /**
     * Delete student (academy can only delete enrollments)
     */
    public function destroy(Request $request, string $id)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
        }

        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');

        $enrollment = Enrollment::whereIn('teacher_id', $teacherIds)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('student_id', $id);
            })
            ->first();

        if (!$enrollment) {
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => 'Student not found',
                'data' => null,
            ], 404);
        }

        $this->studentService->deleteEnrollment($enrollment);

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'تم إلغاء تسجيل الطالب بنجاح',
            'data' => null,
        ]);
    }

    /**
     * Toggle student status (suspend/activate)
     */
    public function toggleStatus(Request $request, string $id)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'Unauthorized',
                'data' => null,
            ], 403);
        }

        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');

        $enrollment = Enrollment::whereIn('teacher_id', $teacherIds)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('student_id', $id);
            })
            ->first();

        if (!$enrollment) {
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => 'Student not found',
                'data' => null,
            ], 404);
        }

        $this->studentService->toggleStatus($enrollment);

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => $enrollment->is_active ? 'تم تفعيل حساب الطالب بنجاح' : 'تم تعطيل حساب الطالب بنجاح',
            'data' => [
                'is_active' => $enrollment->is_active,
            ],
        ]);
    }

    /**
     * Search student by phone
     */
    public function searchByPhone(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        $student = Student::findByPhone($request->phone);

        if ($student) {
            return response()->json([
                'status' => true,
                'status_code' => 200,
                'message' => 'Student found',
                'data' => [
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
                ],
            ]);
        }

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'Student not found',
            'data' => [
                'found' => false,
                'student' => null,
            ],
        ]);
    }
}
