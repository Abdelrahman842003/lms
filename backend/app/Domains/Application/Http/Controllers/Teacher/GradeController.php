<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Enrollments\DTOs\TeacherGradeData;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Grade\StoreGradeRequest;
use App\Domains\Application\Http\Requests\Teacher\Grade\UpdateGradeRequest;
use App\Domains\Application\Http\Resources\Teacher\GradeResource;
use App\Domains\Application\Services\Teacher\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class GradeController extends Controller
{
    use \App\Domains\Support\Traits\ResolvesTeacher;

    public function __construct(
        private GradeService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search']);
        $academyId = $request->header('X-Academy-Id');
        
        $grades = $this->service->getGrades($teacher, $perPage, $filters, $academyId);
        
        return $this->successResponse(
            GradeResource::collection($grades)->response()->getData(true)
        );
    }

    public function store(StoreGradeRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id');
        
        // We can't use GradeData::fromRequest directly here because we need to manipulate academy_id logic first
        // Or we can modify the request input before creating DTO
        
        $data = $request->validated();
        
        // Only set academy_id if teacher is actually affiliated with that academy
        // Don't set it based on just the dropdown selection
        if ($academyId && $academyId !== 'independent') {
            // Check if teacher belongs to this academy using the pivot table
            $teacherBelongsToAcademy = DB::table('academy_teacher')
                ->where('teacher_id', $teacher->id)
                ->where('academy_id', $academyId)
                ->where('is_active', true)
                ->exists();
            
            if ($teacherBelongsToAcademy) {
                $request->merge(['academy_id' => $academyId]);
            } else {
                // Teacher doesn't belong to this academy, keep it independent
                $request->merge(['academy_id' => null]);
            }
        } else {
            // Independent mode
            $request->merge(['academy_id' => null]);
        }
        
        $gradeData = GradeData::fromRequest($request);
        $grade = $this->service->createGrade($teacher, $gradeData);

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم إضافة الصف الدراسي بنجاح'
        ], 201);
    }

    public function update(UpdateGradeRequest $request, Grade $grade): JsonResponse
    {
        Gate::authorize('update', $grade);

        $gradeData = GradeData::fromRequest($request);
        $grade = $this->service->updateGrade($grade, $gradeData);

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم تحديث الصف الدراسي بنجاح'
        ]);
    }

    public function destroy(Request $request, Grade $grade): JsonResponse
    {
        Gate::authorize('delete', $grade);

        $this->service->deleteGrade($grade);

        return $this->successResponse([
            'message' => 'تم حذف الصف الدراسي بنجاح'
        ]);
    }
}
