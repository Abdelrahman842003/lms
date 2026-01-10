<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AcademyService;
use App\Http\Requests\Admin\Academy\StoreAcademyRequest;
use App\Http\Requests\Admin\Academy\UpdateAcademyRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AcademyController extends Controller
{
    public function __construct(
        private AcademyService $academyService
    ) {}

    /**
     * Get list of academies
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'status']);

        $academies = $this->academyService->getAcademies($perPage, $filters);

        return $this->successResponse(['academies' => $academies]);
    }

    /**
     * Create new academy
     */
    public function store(StoreAcademyRequest $request): JsonResponse
    {
        $academy = $this->academyService->create($request->validated());

        return $this->successResponse([
            'academy' => $academy,
        ], 'تم إنشاء الأكاديمية بنجاح', 201);
    }

    /**
     * Get academy details
     */
    public function show(string $id): JsonResponse
    {
        $academy = \App\Models\Academy::with(['teachers', 'secretaries', 'billings'])
            ->findOrFail($id);

        return $this->successResponse(['academy' => $academy]);
    }

    /**
     * Update academy
     */
    public function update(UpdateAcademyRequest $request, string $id): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($id);
        $academy = $this->academyService->update($academy, $request->validated());

        return $this->successResponse([
            'academy' => $academy,
            'message' => 'تم تحديث الأكاديمية بنجاح',
        ]);
    }

    /**
     * Toggle academy status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($id);
        $isActive = $this->academyService->toggleStatus($academy);

        return $this->successResponse([
            'message' => $isActive ? 'تم تفعيل الأكاديمية' : 'تم تعطيل الأكاديمية',
            'is_active' => $isActive,
        ]);
    }

    /**
     * Delete academy
     */
    public function destroy(string $id): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($id);
        $this->academyService->delete($academy);

        return $this->successResponse(['message' => 'تم حذف الأكاديمية بنجاح']);
    }

    /**
     * Get academy secretaries
     */
    public function secretaries(string $id): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($id);
        $secretaries = $academy->secretaries()->withPivot('permissions', 'is_active')->get();

        return $this->successResponse(['secretaries' => $secretaries]);
    }

    /**
     * Add secretary to academy
     */
    public function addSecretary(Request $request, string $id): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($id);

        $validated = $request->validate([
            'secretary_id' => 'required|exists:secretaries,id',
            'permissions' => 'nullable|array',
        ]);

        try {
            $secretary = $this->academyService->addSecretary(
                $academy,
                $validated['secretary_id'],
                $validated['permissions'] ?? []
            );

            return $this->successResponse([
                'secretary' => $secretary,
            ], 'تم إضافة السكرتير بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Remove secretary from academy
     */
    public function removeSecretary(string $academyId, string $secretaryId): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($academyId);
        $this->academyService->removeSecretary($academy, $secretaryId);

        return $this->successResponse(['message' => 'تم حذف السكرتير من الأكاديمية بنجاح']);
    }

    /**
     * Regenerate QR codes
     */
    public function regenerateQrCodes(string $id): JsonResponse
    {
        $academy = \App\Models\Academy::findOrFail($id);
        $academy = $this->academyService->regenerateQrCodes($academy);

        return $this->successResponse([
            'academy' => $academy,
            'message' => 'تم تجديد رموز QR بنجاح',
        ]);
    }
}
