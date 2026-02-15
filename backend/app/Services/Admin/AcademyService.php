<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Academy;
use App\Models\Secretary;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class AcademyService
{
    /**
     * Get paginated academies
     */
    public function getAcademies(int $perPage, array $filters): LengthAwarePaginator
    {
        return Academy::filter($filters)
            ->withCount(['teachers', 'secretaries'])
            ->paginate($perPage);
    }

    /**
     * Create new academy
     */
    public function create(array $data): Academy
    {
        return Academy::create($data);
    }

    /**
     * Update academy
     */
    public function update(Academy $academy, array $data): Academy
    {
        $academy->update($data);
        return $academy->fresh();
    }

    /**
     * Toggle academy status
     */
    public function toggleStatus(Academy $academy): bool
    {
        $academy->is_active = !$academy->is_active;
        $academy->save();
        
        return $academy->is_active;
    }

    /**
     * Delete academy
     */
    public function delete(Academy $academy): void
    {
        $academy->delete();
    }

    /**
     * Add secretary to academy
     */
    public function addSecretary(Academy $academy, string $secretaryId, array $permissions = []): Secretary
    {
        // Check if already exists
        if ($academy->secretaries()->where('secretary_id', $secretaryId)->exists()) {
            throw new \Exception('السكرتير موجود بالفعل في الأكاديمية');
        }

        $academy->secretaries()->attach($secretaryId, [
            'permissions' => $permissions,
            'is_active' => true,
        ]);

        return Secretary::findOrFail($secretaryId);
    }

    /**
     * Remove secretary from academy
     */
    public function removeSecretary(Academy $academy, string $secretaryId): void
    {
        $academy->secretaries()->detach($secretaryId);
    }

    /**
     * Regenerate QR codes
     */
    public function regenerateQrCodes(Academy $academy): Academy
    {
        $academy->checkin_qr_code = Str::random(32);
        $academy->checkout_qr_code = Str::random(32);
        $academy->save();

        return $academy->fresh();
    }

    /**
     * Set subscription plan for academy (similar to teacher's setSubscriptionPlan)
     */
    public function setSubscriptionPlan(string $academyId, array $data): Academy
    {
        $academy = Academy::findOrFail($academyId);

        $type = $data['type']; // 'trial', 'term', 'custom'
        $academy->plan_type = $type;
        
        // Calculate Expiry
        if ($type === 'trial' || $type === 'custom') {
            $days = (int) ($data['days'] ?? 0);
            $academy->plan_expires_at = now()->addDays($days);
        } elseif ($type === 'term') {
            $months = (int) ($data['months'] ?? 6);
            $academy->plan_expires_at = now()->addMonths($months);
        }

        // Student Limits
        if (!empty($data['is_unlimited_students'])) {
            $academy->plan_max_students = null;
            $academy->is_unlimited_students = true;
        } else {
            $academy->plan_max_students = (int) ($data['max_students'] ?? 0);
            $academy->is_unlimited_students = false;
        }

        // Set default subscription fee if not set
        if ($academy->subscription_fee <= 0) {
            $academy->subscription_fee = \App\Services\Infrastructure\HelperService::getAcademyStudentPrice();
            if ($academy->subscription_fee <= 0) $academy->subscription_fee = 20; // Fallback
        }

        $academy->save();

        return $academy;
    }
}
