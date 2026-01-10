<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\SecretaryService;
use App\Http\Requests\Academy\StoreSecretaryRequest;
use App\Http\Requests\Academy\UpdateSecretaryRequest;
use App\DTOs\Academy\SecretaryData;
use App\Http\Resources\Academy\SecretaryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SecretaryController extends Controller
{
    public function __construct(
        private SecretaryService $secretaryService
    ) {}

    /**
     * Get list of secretaries in academy
     */
    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');

        $secretaries = $this->secretaryService->getSecretaries($academy, $perPage, $search);

        return $this->successResponse(SecretaryResource::collection($secretaries));
    }

    /**
     * Create new secretary
     */
    public function store(StoreSecretaryRequest $request): JsonResponse
    {
        $academy = $request->user();

        try {
            $data = SecretaryData::fromRequest($request);
            $newSecretary = $this->secretaryService->createSecretary($academy, $data);

            return $this->successResponse(
                new SecretaryResource($newSecretary),
                'تم إضافة السكرتير بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get secretary details
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $targetSecretary = $academy->secretaries()->findOrFail($id);

        return $this->successResponse(['secretary' => $targetSecretary]);
    }

    /**
     * Update secretary
     */
    public function update(UpdateSecretaryRequest $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $targetSecretary = $academy->secretaries()->findOrFail($id);

        try {
            $data = SecretaryData::fromRequest($request);
            $updatedSecretary = $this->secretaryService->updateSecretary($targetSecretary, $data);

            return $this->successResponse(
                new SecretaryResource($updatedSecretary),
                'تم تحديث بيانات السكرتير بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Update secretary permissions
     */
    public function updatePermissions(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $validated = $request->validate([
            'permissions' => 'required|array',
        ]);

        $this->secretaryService->updatePermissions($academy, $id, $validated['permissions']);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات السكرتير بنجاح',
        ]);
    }

    /**
     * Toggle secretary status
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $isActive = $this->secretaryService->toggleStatus($academy, $id);

        return $this->successResponse([
            'message' => $isActive ? 'تم تفعيل السكرتير' : 'تم تعطيل السكرتير',
            'is_active' => $isActive,
        ]);
    }

    /**
     * Remove secretary from academy
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $this->secretaryService->removeSecretary($academy, $id);

        return $this->successResponse([
            'message' => 'تم حذف السكرتير من الأكاديمية بنجاح',
        ]);
    }

    /**
     * Check if phone is available
     */
    public function checkPhone(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'exclude_id' => 'nullable|string',
        ]);

        $isAvailable = $this->secretaryService->isPhoneAvailable(
            $validated['phone'],
            $validated['exclude_id'] ?? null
        );

        return $this->successResponse([
            'available' => $isAvailable,
        ]);
    }
}
