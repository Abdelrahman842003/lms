<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Grade\StoreGradeRequest;
use App\Http\Requests\Teacher\Grade\UpdateGradeRequest;
use App\Http\Resources\Teacher\GradeResource;
use App\Models\Grade;
use App\Services\Teacher\GradeService;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    protected $gradeService;

    public function __construct(GradeService $gradeService)
    {
        $this->gradeService = $gradeService;
    }

    public function index(Request $request)
    {
        $teacher = $request->user();
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search']);
        $grades = $this->gradeService->getGrades($teacher, $perPage, $filters);
        
        return $this->successResponse(
            GradeResource::collection($grades)->response()->getData(true)
        );
    }

    public function store(StoreGradeRequest $request)
    {
        $teacher = $request->user();
        $grade = $this->gradeService->createGrade($teacher, $request->validated());

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم إضافة الصف الدراسي بنجاح'
        ], 201);
    }

    public function update(UpdateGradeRequest $request, Grade $grade)
    {
        if ($grade->teacher_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $grade = $this->gradeService->updateGrade($grade, $request->validated());

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم تحديث الصف الدراسي بنجاح'
        ]);
    }

    public function destroy(Request $request, Grade $grade)
    {
        if ($grade->teacher_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->gradeService->deleteGrade($grade);

        return $this->successResponse([
            'message' => 'تم حذف الصف الدراسي بنجاح'
        ]);
    }
}
