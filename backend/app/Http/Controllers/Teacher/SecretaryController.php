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

    public function checkPhone(Request $request)
    {
        $request->validate(['phone' => 'required|string']);
        
        $secretary = Secretary::where('phone', $request->phone)->first();
        
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

        $secretary = Secretary::where('phone', $validated['phone'])->first();

        if ($secretary) {
            // Check if already attached
            if ($teacher->secretaries()->where('secretary_id', $secretary->id)->exists()) {
                return $this->errorResponse('هذا السكرتير مضاف لديك بالفعل', 422);
            }
            
            // Attach existing secretary
            $teacher->secretaries()->attach($secretary->id, [
                'permissions' => json_encode($validated['permissions'] ?? [])
            ]);
            
            $message = 'تم إضافة السكرتير الموجود بنجاح';
        } else {
            // Create new secretary
            $secretary = Secretary::create([
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
            ]);

            // Attach to teacher
            $teacher->secretaries()->attach($secretary->id, [
                'permissions' => json_encode($validated['permissions'] ?? [])
            ]);
            
            $message = 'تم إضافة السكرتير بنجاح';
        }

        return $this->successResponse([
            'secretary' => $secretary,
            'message' => $message
        ], 201);
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
        $secretary = $teacher->secretaries()->findOrFail($id);
        $validated = $request->validated();

        // Only update basic info if it's the creator or if we decide any teacher can update basic info
        // For now, let's allow updating basic info as it propagates to all (shared profile)
        // OR we could restrict it. Let's stick to simple update for now.
        
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
        
        // Detach instead of delete to preserve for other teachers
        $teacher->secretaries()->detach($id);

        // Optional: If no other teachers attached, verify if we should delete the record?
        // For now, keep it simple: just detach.

        return $this->successResponse([
            'message' => 'تم حذف السكرتير بنجاح'
        ]);
    }

    public function updatePermissions(UpdatePermissionsRequest $request, string $id)
    {
        $teacher = $request->user();
        
        // Update pivot permissions
        $teacher->secretaries()->updateExistingPivot($id, [
            'permissions' => json_encode($request->validated()['permissions'] ?? [])
        ]);

        return $this->successResponse([
            'message' => 'تم تحديث صلاحيات السكرتير بنجاح',
            'permissions' => $request->validated()['permissions'] ?? [],
        ]);
    }

    public function toggleStatus(Request $request, string $id)
    {
        $teacher = $request->user();
        $secretary = $teacher->secretaries()->findOrFail($id);

        // This toggles global status. If we want per-teacher status, we need a pivot column.
        // Assuming global status for now based on previous schema.
        $secretary->update([
            'is_active' => !$secretary->is_active
        ]);

        return $this->successResponse([
            'message' => $secretary->is_active ? 'تم تفعيل حساب السكرتير بنجاح' : 'تم تعطيل حساب السكرتير بنجاح',
            'is_active' => $secretary->is_active
        ]);
    }
}
