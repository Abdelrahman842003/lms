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
    use \App\Traits\ResolvesTeacher;
    protected $gradeService;

    public function __construct(GradeService $gradeService)
    {
        $this->gradeService = $gradeService;
    }

    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search']);
        $academyId = $request->header('X-Academy-Id');
        
        $grades = $this->gradeService->getGrades($teacher, $perPage, $filters, $academyId);
        
        return $this->successResponse(
            GradeResource::collection($grades)->response()->getData(true)
        );
    }

    public function store(StoreGradeRequest $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id');
        
        $data = $request->validated();
        
        // Only set academy_id if teacher is actually affiliated with that academy
        // Don't set it based on just the dropdown selection
        if ($academyId && $academyId !== 'independent') {
            // Check if teacher belongs to this academy using the pivot table
            $teacherBelongsToAcademy = \Illuminate\Support\Facades\DB::table('academy_teacher')
                ->where('teacher_id', $teacher->id)
                ->where('academy_id', $academyId)
                ->where('is_active', true)
                ->exists();
            
            if ($teacherBelongsToAcademy) {
                $data['academy_id'] = $academyId;
            } else {
                // Teacher doesn't belong to this academy, keep it independent
                $data['academy_id'] = null;
            }
        } else {
            // Independent mode
            $data['academy_id'] = null;
        }
        
        $grade = $this->gradeService->createGrade($teacher, $data);

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم إضافة الصف الدراسي بنجاح'
        ], 201);
    }

    public function update(UpdateGradeRequest $request, Grade $grade)
    {
        if ($grade->teacher_id !== $this->getTeacherFromRequest($request)->id) {
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
        if ($grade->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->gradeService->deleteGrade($grade);

        return $this->successResponse([
            'message' => 'تم حذف الصف الدراسي بنجاح'
        ]);
    }
}
