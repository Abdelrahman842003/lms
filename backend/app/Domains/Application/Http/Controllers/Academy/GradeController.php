<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Enrollments\DTOs\GradeData;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Grade\StoreGradeRequest;
use App\Domains\Application\Http\Requests\Academy\Grade\UpdateGradeRequest;
use App\Domains\Application\Http\Resources\Teacher\GradeResource;
use App\Domains\Application\Services\Academy\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GradeController extends Controller
{
    public function __construct(
        private GradeService $service
    ) {}

    /**
     * Get the academy from the authenticated user or secretary
     */
    protected function getAcademy(Request $request): ?\App\Domains\Auth\Models\Academy
    {
        $user = Auth::user();
        
        if ($user instanceof \App\Domains\Auth\Models\Academy) {
            return $user;
        }
        
        // Secretary case - get academy via relationship
        if ($user instanceof \App\Domains\Auth\Models\Secretary) {
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
        $filters = $request->only(['teacher_id', 'name']);
        
        $result = $this->service->getGrades($academy, $filters, $perPage);

        // If result is a collection (teacher_id filter), return simple data
        if ($result instanceof \Illuminate\Support\Collection) {
            return $this->successResponse([
                'data' => $result
            ]);
        }

        // If result is paginator (detail view), return resource collection
        if ($request->has('name') && $request->name) {
            return $this->successResponse(
                GradeResource::collection($result)->response()->getData(true)
            );
        }

        // Default grouped view (paginator of arrays)
        return $this->successResponse([
            'data' => $result->items(),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
                'per_page' => $result->perPage(),
            ]
        ]);
    }

    public function store(StoreGradeRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = GradeData::fromRequest($request);
        
        $grade = $this->service->createGrade($academy, $data);

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم إضافة الصف الدراسي بنجاح'
        ], 201);
    }

    public function update(UpdateGradeRequest $request, Grade $grade): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Verify grade belongs to this academy
        if (!$this->isOwnedByAcademy($academy, $grade)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = GradeData::fromRequest($request);
        $grade = $this->service->updateGrade($academy, $grade, $data);

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم تحديث الصف الدراسي بنجاح'
        ]);
    }

    public function destroy(Request $request, Grade $grade): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->isOwnedByAcademy($academy, $grade)) {
            return $this->errorResponse('Unauthorized', 403);
        }
        
        $this->service->deleteGrade($grade);

        return $this->successResponse([
            'message' => 'تم حذف الصف الدراسي بنجاح'
        ]);
    }

    public function bulkUpdateName(Request $request): JsonResponse
    {
        $request->validate([
            'old_name' => 'required|string',
            'new_name' => 'required|string|max:255',
        ]);

        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $count = $this->service->bulkUpdateName($academy, $request->old_name, $request->new_name);

        return $this->successResponse([
            'message' => "تم تحديث اسم الصف لـ {$count} سجلات بنجاح"
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string',
        ]);

        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $count = $this->service->bulkDelete($academy, $request->name);

        return $this->successResponse([
            'message' => "تم حذف {$count} سجلات للصف بنجاح"
        ]);
    }

    private function isOwnedByAcademy($academy, Grade $grade): bool
    {
        if ($grade->academy_id === $academy->id) {
            return true;
        }
        
        if ($grade->teacher) {
            return $grade->teacher->academies()
                ->where('academy_id', $academy->id)
                ->exists();
        }

        return false;
    }
}
