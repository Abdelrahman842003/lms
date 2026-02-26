<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SecretaryService
{
    public function getSecretaries(Teacher $teacher, int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        $query = $teacher->secretaries()
            ->latest();

        if (isset($filters['search']) && $filters['search']) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('phone', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['status']) && $filters['status'] !== null) {
            $query->where('is_active', $filters['status']);
        }

        return $query->paginate($perPage);
    }

    public function checkPhone(string $phone): ?Secretary
    {
        return Secretary::where('phone', $phone)->first();
    }

    public function createOrAttach(Teacher $teacher, array $data): array
    {
        return DB::transaction(function () use ($teacher, $data) {
            $secretary = Secretary::where('phone', $data['phone'])->first();
            $message = '';

            if ($secretary) {
                // Check if already attached
                if ($teacher->secretaries()->where('secretary_id', $secretary->id)->exists()) {
                    throw new \Exception('هذا السكرتير مضاف لديك بالفعل', 422);
                }
                
                // Attach existing secretary
                $teacher->secretaries()->attach($secretary->id, [
                    'permissions' => json_encode($data['permissions'] ?? [])
                ]);
                
                $message = 'تم إضافة السكرتير الموجود بنجاح';
            } else {
                // Create new secretary
                $secretary = Secretary::create([
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'password' => Hash::make($data['password']),
                ]);

                // Attach to teacher
                $teacher->secretaries()->attach($secretary->id, [
                    'permissions' => json_encode($data['permissions'] ?? [])
                ]);
                
                $message = 'تم إضافة السكرتير بنجاح';
            }

            return [
                'secretary' => $secretary,
                'message' => $message
            ];
        });
    }

    public function update(Teacher $teacher, string $id, array $data): Secretary
    {
        $secretary = $teacher->secretaries()->findOrFail($id);

        $updateData = [
            'name' => $data['name'] ?? $secretary->name,
            'phone' => $data['phone'] ?? $secretary->phone,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $secretary->update($updateData);

        return $secretary;
    }

    public function detach(Teacher $teacher, string $id): void
    {
        $teacher->secretaries()->detach($id);
    }

    public function updatePermissions(Teacher $teacher, string $id, array $permissions): void
    {
        $teacher->secretaries()->updateExistingPivot($id, [
            'permissions' => json_encode($permissions)
        ]);
    }

    public function toggleStatus(Teacher $teacher, string $id): Secretary
    {
        $secretary = $teacher->secretaries()->findOrFail($id);

        // This toggles global status. If we want per-teacher status, we need a pivot column.
        // Assuming global status for now based on previous schema.
        $secretary->update([
            'is_active' => !$secretary->is_active
        ]);

        return $secretary;
    }
}
