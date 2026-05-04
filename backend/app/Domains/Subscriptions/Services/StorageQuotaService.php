<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;

/**
 * Central service for tracking and enforcing storage quotas on R2.
 *
 * Storage is counted as: video files (video_size_bytes) + attachments (file_size).
 * Avatars are intentionally excluded (< 100 KB each, negligible).
 */
class StorageQuotaService
{
    private const BYTES_PER_GB = 1_073_741_824; // 1024^3

    // ──────────────────────────────────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Recalculate actual storage usage from DB and persist it.
     * Use this for backfilling / reconciliation (e.g. via Artisan command).
     */
    public function recalculateUsage(Model $owner): int
    {
        [$ownerType, $ownerId] = $this->resolveOwnerTypeAndId($owner);

        $videoBytes = (int) Video::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->sum('video_size_bytes');

        $attachmentBytes = (int) VideoAttachment::query()
            ->whereHas('video', function ($q) use ($ownerType, $ownerId): void {
                $q->where('owner_type', $ownerType)->where('owner_id', $ownerId);
            })
            ->sum('file_size');

        $total = $videoBytes + $attachmentBytes;

        $owner->forceFill(['storage_used_bytes' => $total])->save();

        return $total;
    }

    /**
     * Assert that the owner has enough remaining quota before an upload.
     *
     * @throws AuthorizationException when the limit would be exceeded
     */
    public function assertCanUpload(Model $owner, int $incomingBytes): void
    {
        $limitGb = $owner->storage_limit_gb ?? null;

        // null = unlimited
        if ($limitGb === null) {
            return;
        }

        $limitBytes = $this->gbToBytes((int) $limitGb);
        $usedBytes  = (int) ($owner->storage_used_bytes ?? 0);

        if (($usedBytes + $incomingBytes) > $limitBytes) {
            $usedGb      = round($usedBytes / self::BYTES_PER_GB, 2);
            $incomingGb  = round($incomingBytes / self::BYTES_PER_GB, 2);
            $remainingGb = round(max(0, $limitBytes - $usedBytes) / self::BYTES_PER_GB, 2);

            throw new AuthorizationException(
                "تجاوزت السعة التخزينية المسموحة ({$limitGb} GB). " .
                "المستخدم: {$usedGb} GB، الملف المراد رفعه: {$incomingGb} GB، المتبقي: {$remainingGb} GB."
            );
        }
    }

    /**
     * Increment the owner's used-storage counter after a successful upload.
     */
    public function incrementUsage(Model $owner, int $bytes): void
    {
        if ($bytes <= 0) {
            return;
        }

        if (method_exists($owner, 'tenantPlan')) {
            $owner->tenantPlan()->increment('storage_used_bytes', $bytes);
            return;
        }

        $owner->increment('storage_used_bytes', $bytes);
    }

    /**
     * Decrement the owner's used-storage counter after a deletion.
     * Clamps to zero to avoid negative values.
     *
     * Uses atomic DB operation to prevent race conditions when multiple
     * deletions occur simultaneously.
     */
    public function decrementUsage(Model $owner, int $bytes): void
    {
        if ($bytes <= 0) {
            return;
        }

        if (method_exists($owner, 'tenantPlan')) {
            \Illuminate\Support\Facades\DB::table('tenant_plans')
                ->where('tenant_id', $owner->id)
                ->where('tenant_type', $owner->getMorphClass())
                ->update([
                    'storage_used_bytes' => \Illuminate\Support\Facades\DB::raw("GREATEST(0, CAST(storage_used_bytes AS SIGNED) - {$bytes})")
                ]);
        } else {
            // Atomic operation: GREATEST(0, storage_used_bytes - ?)
            // This prevents race conditions and negative values
            \Illuminate\Support\Facades\DB::statement(
                'UPDATE ' . $owner->getTable() .
                ' SET storage_used_bytes = GREATEST(0, storage_used_bytes - ?) WHERE id = ?',
                [$bytes, $owner->getKey()]
            );
        }

        // Refresh the model to reflect the new value
        $owner->refresh();
    }

    /**
     * Return a snapshot of storage state suitable for API responses.
     *
     * @return array{
     *   used_bytes: int,
     *   used_gb: float,
     *   limit_gb: int|null,
     *   remaining_bytes: int|null,
     *   remaining_gb: float|null,
     *   percentage: float,
     *   is_unlimited: bool,
     * }
     */
    public function getStorageSnapshot(Model $owner): array
    {
        $limitGb    = isset($owner->storage_limit_gb) ? (int) $owner->storage_limit_gb : null;
        $usedBytes  = (int) ($owner->storage_used_bytes ?? 0);
        $usedGb     = round($usedBytes / self::BYTES_PER_GB, 4);
        $unlimited  = $limitGb === null;

        $limitBytes     = $unlimited ? null : $this->gbToBytes($limitGb);
        $remainingBytes = $unlimited ? null : max(0, $limitBytes - $usedBytes);
        $remainingGb    = $remainingBytes !== null ? round($remainingBytes / self::BYTES_PER_GB, 4) : null;

        $percentage = 0.0;
        if (! $unlimited && $limitBytes > 0) {
            $percentage = round(min(100.0, ($usedBytes / $limitBytes) * 100), 2);
        }

        return [
            'used_bytes'      => $usedBytes,
            'used_gb'         => $usedGb,
            'limit_gb'        => $limitGb,
            'remaining_bytes' => $remainingBytes,
            'remaining_gb'    => $remainingGb,
            'percentage'      => $percentage,
            'is_unlimited'    => $unlimited,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Resolve the VideoOwnerType string and owner UUID for DB queries.
     *
     * @return array{string, string}
     */
    private function resolveOwnerTypeAndId(Model $owner): array
    {
        if ($owner instanceof Academy) {
            return [VideoOwnerType::ACADEMY->value, (string) $owner->getKey()];
        }

        if ($owner instanceof Teacher) {
            return [VideoOwnerType::INDEPENDENT_TEACHER->value, (string) $owner->getKey()];
        }

        throw new \InvalidArgumentException(
            'StorageQuotaService only supports Teacher and Academy models; got ' . $owner::class
        );
    }

    private function gbToBytes(int $gb): int
    {
        return max(0, $gb) * self::BYTES_PER_GB;
    }
}
