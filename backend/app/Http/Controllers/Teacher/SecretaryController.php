<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Secretary\StoreSecretaryRequest;
use App\Http\Requests\Teacher\Secretary\UpdateSecretaryRequest;
use App\Http\Requests\Teacher\Secretary\UpdatePermissionsRequest;
use App\Models\Secretary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use App\Services\Teacher\SecretaryService;

class SecretaryController extends Controller
{
    protected $secretaryService;

    public function __construct(SecretaryService $secretaryService)
    {
        $this->secretaryService = $secretaryService;
    }
    public function index(Request $request)
    {
        $teacher = $request->user();
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'status']);

        $secretaries = $this->secretaryService->getSecretaries($teacher, $perPage, $filters);

        return $this->successResponse([
            'secretaries' => $secretaries
        ]);
    }

    public function checkPhone(Request $request)
    {
        $request->validate(['phone' => 'required|string']);
        
        $secretary = $this->secretaryService->checkPhone($request->phone);
        
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

    public function store(StoreSecretaryRequest $request)
    {
        $teacher = $request->user();
        $validated = $request->validated();

        try {
            $result = $this->secretaryService->createOrAttach($teacher, $validated);

            return $this->successResponse([
                'secretary' => $result['secretary'],
                'message' => $result['message']
            ], 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function show(string $id)
    {
        $teacher = request()->user();
        $secretary = $teacher->secretaries()->findOrFail($id);
        
        // Get permissions from pivot
        $pivotPermissions = json_decode($secretary->pivot->permissions ?? '[]', true);
        $secretary->permission_names = $pivotPermissions;

        return $this->successResponse([
            'secretary' => $secretary
        ]);
    }

    public function update(UpdateSecretaryRequest $request, string $id)
    {
        $teacher = $request->user();
        $validated = $request->validated();

        $secretary = $this->secretaryService->update($teacher, $id, $validated);

        return $this->successResponse([
            'secretary' => $secretary,
            'message' => 'تم تحديث بيانات السكرتير بنجاح'
        ]);
    }

    public function destroy(string $id)
    {
        $teacher = request()->user();
        $this->secretaryService->detach($teacher, $id);

        return $this->successResponse([
            'message' => 'تم حذف السكرتير بنجاح'
        ]);
    }

    public function updatePermissions(UpdatePermissionsRequest $request, string $id)
    {
        $teacher = $request->user();
        $this->secretaryService->updatePermissions($teacher, $id, $request->validated()['permissions'] ?? []);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات السكرتير بنجاح',
            'permissions' => $request->validated()['permissions'] ?? [],
        ]);
    }

    public function toggleStatus(Request $request, string $id)
    {
        $teacher = $request->user();
        $secretary = $this->secretaryService->toggleStatus($teacher, $id);

        return $this->successResponse([
            'message' => $secretary->is_active ? 'تم تفعيل حساب السكرتير بنجاح' : 'تم تعطيل حساب السكرتير بنجاح',
            'is_active' => $secretary->is_active
        ]);
    }
}
