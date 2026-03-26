<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class SecretaryService
{
    /**
     * Get paginated secretaries for academy
     */
    public function getSecretaries(Academy $academy, int $perPage, ?string $search = null): LengthAwarePaginator
    {
        return $academy->secretaries()
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })
            ->withPivot('permissions', 'is_active')
            ->paginate($perPage);
    }

    /**
     * Create and add secretary to academy
     */
    /**
     * Create and add secretary to academy
     */
    public function createSecretary(Academy $academy, \App\Domains\Auth\DTOs\SecretaryData $data): Secretary
    {
        // Check if phone already exists
        $existing = Secretary::where('phone', $data->phone)->first();
        
        if ($existing) {
            // If secretary exists, just attach to academy
            if ($academy->secretaries()->where('secretary_id', $existing->id)->exists()) {
                throw new DomainException('السكرتير موجود بالفعل في الأكاديمية');
            }

            $academy->secretaries()->attach($existing->id, [
                'permissions' => json_encode($data->permissions ?? []),
                'is_active' => true,
            ]);

            return $existing;
        }

        // Create new secretary
        $secretary = Secretary::create([
            'name' => $data->name,
            'phone' => $data->phone,
            'password' => $data->password,
            'avatar_key' => $data->avatar_key,
            'is_active' => true,
        ]);

        // Attach to academy
        $academy->secretaries()->attach($secretary->id, [
            'permissions' => json_encode($data->permissions ?? []),
            'is_active' => true,
        ]);

        return $secretary;
    }

    /**
     * Update secretary
     */
    /**
     * Update secretary
     */
    public function updateSecretary(Secretary $secretary, \App\Domains\Auth\DTOs\SecretaryData $data): Secretary
    {
        $updateData = [];

        if ($data->name) {
            $updateData['name'] = $data->name;
        }

        if ($data->phone) {
            // Check if phone is already taken by another secretary
            $exists = Secretary::where('phone', $data->phone)
                ->where('id', '!=', $secretary->id)
                ->exists();
            
            if ($exists) {
                throw new DomainException('رقم الهاتف مستخدم بالفعل');
            }

            $updateData['phone'] = $data->phone;
        }

        if ($data->password) {
            $updateData['password'] = $data->password;
        }

        if ($data->avatar_key) {
            $updateData['avatar_key'] = $data->avatar_key;
        }

        $secretary->update($updateData);

        return $secretary->fresh();
    }

    /**
     * Update secretary permissions in academy
     */
    public function updatePermissions(Academy $academy, string $secretaryId, array $permissions): void
    {
        $academy->secretaries()->updateExistingPivot($secretaryId, [
            'permissions' => json_encode($permissions),
        ]);
    }

    /**
     * Toggle secretary status in academy
     */
    public function toggleStatus(Academy $academy, string $secretaryId): bool
    {
        $secretary = $academy->secretaries()->findOrFail($secretaryId);
        $currentStatus = $secretary->pivot->is_active;

        $academy->secretaries()->updateExistingPivot($secretaryId, [
            'is_active' => !$currentStatus,
        ]);

        return !$currentStatus;
    }

    /**
     * Remove secretary from academy
     */
    public function removeSecretary(Academy $academy, string $secretaryId): void
    {
        $academy->secretaries()->detach($secretaryId);
    }

    /**
     * Check if phone is available
     */
    public function isPhoneAvailable(string $phone, ?string $excludeId = null): bool
    {
        $query = Secretary::where('phone', $phone);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return !$query->exists();
    }
}
