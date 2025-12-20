<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Secretary\StoreSecretaryRequest;
use App\Http\Requests\Teacher\Secretary\UpdateSecretaryRequest;
use App\Http\Requests\Teacher\Secretary\UpdatePermissionsRequest;
use App\Models\Secretary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SecretaryController extends Controller
{
    public function index(Request $request)
    {
        $teacher = $request->user();
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $status = $request->input('status');

        $query = $teacher->secretaries()
            ->latest()
            ->filter(['search' => $search, 'status' => $status]);

        $secretaries = $query->paginate($perPage);

        return $this->successResponse([
            'secretaries' => $secretaries
        ]);
    }

    public function store(StoreSecretaryRequest $request)
    {
        $teacher = $request->user();
        $validated = $request->validated();

        $secretary = $teacher->secretaries()->create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
        ]);

        if (isset($validated['permissions'])) {
            $secretary->syncPermissions($validated['permissions']);
        }

        return $this->successResponse([
            'secretary' => $secretary,
            'message' => 'تم إضافة السكرتير بنجاح'
        ], 201);
    }

    public function show(string $id)
    {
        $teacher = request()->user();
        $secretary = $teacher->secretaries()->findOrFail($id);
        
        $secretary->load('permissions');
        $secretary->permission_names = $secretary->getAllPermissions()->pluck('name');

        return $this->successResponse([
            'secretary' => $secretary
        ]);
    }

    public function update(UpdateSecretaryRequest $request, string $id)
    {
        $teacher = $request->user();
        $secretary = $teacher->secretaries()->findOrFail($id);
        $validated = $request->validated();

        $data = [
            'name' => $validated['name'] ?? $secretary->name,
            'phone' => $validated['phone'] ?? $secretary->phone,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $secretary->update($data);

        return $this->successResponse([
            'secretary' => $secretary,
            'message' => 'تم تحديث بيانات السكرتير بنجاح'
        ]);
    }

    public function destroy(string $id)
    {
        $teacher = request()->user();
        $secretary = $teacher->secretaries()->findOrFail($id);
        
        $secretary->delete();

        return $this->successResponse([
            'message' => 'تم حذف السكرتير بنجاح'
        ]);
    }

    public function updatePermissions(UpdatePermissionsRequest $request, string $id)
    {
        $teacher = $request->user();
        $secretary = $teacher->secretaries()->findOrFail($id);

        $secretary->syncPermissions($request->validated()['permissions'] ?? []);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات السكرتير بنجاح',
            'permissions' => $secretary->getAllPermissions()->pluck('name'),
        ]);
    }

    public function toggleStatus(Request $request, string $id)
    {
        $teacher = $request->user();
        $secretary = $teacher->secretaries()->findOrFail($id);

        $secretary->update([
            'is_active' => !$secretary->is_active
        ]);

        return $this->successResponse([
            'message' => $secretary->is_active ? 'تم تفعيل حساب السكرتير بنجاح' : 'تم تعطيل حساب السكرتير بنجاح',
            'is_active' => $secretary->is_active
        ]);
    }
}
