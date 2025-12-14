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

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $updatedStudent = $this->studentService->updateStudent($student, $request->validated());
        
        return $this->successResponse([
            'student' => new StudentResource($updatedStudent)
        ], 'تم تحديث بيانات الطالب بنجاح');
    }
}
