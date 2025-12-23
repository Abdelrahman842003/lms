<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdateStudentRequest;
use App\Http\Resources\Student\StudentResource;
use App\Models\Student;
use App\Services\Admin\StudentService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    use ApiResponseTrait;

    protected $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'status', 'date_from', 'date_to']);
        $students = $this->studentService->getStudents($perPage, $filters);
        
        return $this->successResponse(
            StudentResource::collection($students)->response()->getData(true)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:students,phone',
            'password' => 'required|string|min:6|confirmed',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $student = $this->studentService->createStudent($validated);
        
        return $this->successResponse([
            'student' => new StudentResource($student)
        ], 'تم إضافة الطالب بنجاح', 201);
    }

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $updatedStudent = $this->studentService->updateStudent($student, $request->validated());
        
        return $this->successResponse([
            'student' => new StudentResource($updatedStudent)
        ], 'تم تحديث بيانات الطالب بنجاح');
    }

    public function statistics()
    {
        $totalStudents = \App\Models\Student::count();
        $activeStudents = \App\Models\Student::count(); // Assuming all are active for now
        $joinedThisMonth = \App\Models\Student::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'suspended_accounts' => 0,
            'joined_this_month' => $joinedThisMonth,
        ]);
    }
}
