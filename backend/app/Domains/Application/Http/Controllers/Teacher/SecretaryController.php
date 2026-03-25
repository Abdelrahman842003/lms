<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Secretary\StoreSecretaryRequest;
use App\Domains\Application\Http\Requests\Teacher\Secretary\UpdatePermissionsRequest;
use App\Domains\Application\Http\Requests\Teacher\Secretary\UpdateSecretaryRequest;
use App\Domains\Application\Services\Teacher\SecretaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecretaryController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private SecretaryService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'status']);

        $secretaries = $this->service->getSecretaries($teacher, $perPage, $filters);

        return $this->successResponse([
            'secretaries' => $secretaries
        ]);
    }

    public function checkPhone(Request $request): JsonResponse
    {
        $request->validate(['phone' => 'required|string']);
        
        $secretary = $this->service->checkPhone($request->phone);
        
        if ($secretary) {
            return $this->successResponse([
                'exists' => true,
                'secretary' => [
                    'id' => $secretary->id,
                    'name' => $secretary->name,
                    'phone' => $secretary->phone,
                    'avatar_key' => $secretary->avatar_key,
                ]
            ]);
        }

        return $this->successResponse(['exists' => false]);
    }

    public function store(StoreSecretaryRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $validated = $request->validated();

        try {
            $result = $this->service->createOrAttach($teacher, $validated);

            return $this->successResponse([
                'secretary' => $result['secretary'],
                'message' => $result['message']
            ], (string) $result['message'], 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $secretary = $teacher->secretaries()->findOrFail($id);
        
        // Get permissions from pivot
        $pivotPermissions = json_decode($secretary->pivot->permissions ?? '[]', true);
        $secretary->permission_names = $pivotPermissions;

        return $this->successResponse([
            'secretary' => $secretary
        ]);
    }

    public function update(UpdateSecretaryRequest $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $validated = $request->validated();

        $secretary = $this->service->update($teacher, $id, $validated);

        return $this->successResponse([
            'secretary' => $secretary,
            'message' => 'تم تحديث بيانات السكرتير بنجاح'
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $this->service->detach($teacher, $id);

        return $this->successResponse([
            'message' => 'تم حذف السكرتير بنجاح'
        ]);
    }

    public function updatePermissions(UpdatePermissionsRequest $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $this->service->updatePermissions($teacher, $id, $request->validated()['permissions'] ?? []);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات السكرتير بنجاح',
            'permissions' => $request->validated()['permissions'] ?? [],
        ]);
    }

    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $secretary = $this->service->toggleStatus($teacher, $id);

        return $this->successResponse([
            'message' => $secretary->is_active ? 'تم تفعيل حساب السكرتير بنجاح' : 'تم تعطيل حساب السكرتير بنجاح',
            'is_active' => $secretary->is_active
        ]);
    }
}
