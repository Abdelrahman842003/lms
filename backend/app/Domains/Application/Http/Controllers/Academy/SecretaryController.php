<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Auth\DTOs\SecretaryData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\StoreSecretaryRequest;
use App\Domains\Application\Http\Requests\Academy\UpdateSecretaryRequest;
use App\Domains\Application\Http\Resources\Academy\SecretaryResource;
use App\Domains\Application\Services\Academy\SecretaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecretaryController extends Controller
{
    public function __construct(
        private SecretaryService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');

        $secretaries = $this->service->getSecretaries($academy, $perPage, $search);

        return $this->successResponse(SecretaryResource::collection($secretaries));
    }

    public function store(StoreSecretaryRequest $request): JsonResponse
    {
        $academy = $request->user();

        try {
            $data = SecretaryData::fromRequest($request);
            $newSecretary = $this->service->createSecretary($academy, $data);

            return $this->successResponse(
                new SecretaryResource($newSecretary),
                'تم إضافة السكرتير بنجاح',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $targetSecretary = $academy->secretaries()->findOrFail($id);

        return $this->successResponse(['secretary' => $targetSecretary]);
    }

    public function update(UpdateSecretaryRequest $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $targetSecretary = $academy->secretaries()->findOrFail($id);

        try {
            $data = SecretaryData::fromRequest($request);
            $updatedSecretary = $this->service->updateSecretary($targetSecretary, $data);

            return $this->successResponse(
                new SecretaryResource($updatedSecretary),
                'تم تحديث بيانات السكرتير بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function updatePermissions(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $validated = $request->validate([
            'permissions' => 'required|array',
        ]);

        $this->service->updatePermissions($academy, $id, $validated['permissions']);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات السكرتير بنجاح',
        ]);
    }

    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $isActive = $this->service->toggleStatus($academy, $id);

        return $this->successResponse([
            'message' => $isActive ? 'تم تفعيل السكرتير' : 'تم تعطيل السكرتير',
            'is_active' => $isActive,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $this->service->removeSecretary($academy, $id);

        return $this->successResponse([
            'message' => 'تم حذف السكرتير من الأكاديمية بنجاح',
        ]);
    }

    public function checkPhone(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'exclude_id' => 'nullable|string',
        ]);

        $isAvailable = $this->service->isPhoneAvailable(
            $validated['phone'],
            $validated['exclude_id'] ?? null
        );

        return $this->successResponse([
            'available' => $isAvailable,
        ]);
    }
}
