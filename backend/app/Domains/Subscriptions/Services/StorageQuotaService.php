<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use Illuminate\Database\Eloquent\Model;

/**
 * Service for tracking storage usage of attachments on R2.
 * (Video storage is now tracked in minutes via StreamQuotaService).
 */
class StorageQuotaService
{
    private const BYTES_PER_GB = 1_073_741_824;

    /**
     * Recalculate actual attachment storage usage from DB and persist it.
     */
    public function recalculateUsage(Model $owner): int
    {
        [$ownerType, $ownerId] = $this->resolveOwnerTypeAndId($owner);

        // We only count attachments now. Videos are handled by minutes quota.
        $attachmentBytes = (int) VideoAttachment::query()
            ->whereHas('video', function ($q) use ($ownerType, $ownerId): void {
                $q->where('owner_type', $ownerType)->where('owner_id', $ownerId);
            })
            ->sum('file_size');

        $owner->forceFill(['storage_used_bytes' => $attachmentBytes])->save();

        return $attachmentBytes;
    }

    /**
     * Increment the owner's used-storage counter (for attachments).
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
     * Decrement the owner's used-storage counter.
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
            \Illuminate\Support\Facades\DB::statement(
                'UPDATE ' . $owner->getTable() .
                ' SET storage_used_bytes = GREATEST(0, storage_used_bytes - ?) WHERE id = ?',
                [$bytes, $owner->getKey()]
            );
        }

        $owner->refresh();
    }

    /**
     * Resolve the VideoOwnerType string and owner UUID.
     */
    private function resolveOwnerTypeAndId(Model $owner): array
    {
        if ($owner instanceof Academy) {
            return [VideoOwnerType::ACADEMY->value, (string) $owner->getKey()];
        }

        if ($owner instanceof Teacher) {
            return [VideoOwnerType::INDEPENDENT_TEACHER->value, (string) $owner->getKey()];
        }

        throw new \InvalidArgumentException('Unsupported owner type.');
    }
}
