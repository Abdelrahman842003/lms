<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Admin;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Auth\UpdateStudentRequest;
use App\Domains\Application\Http\Requests\Admin\Student\StoreStudentRequest;
use App\Domains\Application\Http\Resources\Student\StudentResource;
use App\Domains\Auth\Models\Student;
use App\Domains\Application\Services\Admin\StudentService;
use App\Domains\Support\Traits\ApiResponseTrait;
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

    public function store(StoreStudentRequest $request)
    {
        $student = $this->studentService->createStudent($request->validated());
        
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
        $stats = $this->studentService->getStatistics();

        return $this->successResponse($stats);
    }
}
