<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\CloudflareStreamService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Minutes-based quota service for Cloudflare Stream.
 *
 * Replaces the byte-based StorageQuotaService for video operations.
 * Tracks two dimensions:
 *   - Storage minutes: total duration of videos stored
 *   - Delivery minutes: total minutes of video watched (monthly)
 *
 * StorageQuotaService is NOT deleted — it remains for attachment (R2) tracking.
 */
class StreamQuotaService
{
    public function __construct(
        private readonly CloudflareStreamService $stream,
    ) {}

    // ──────────────────────────────────────────────────────────────────
    // Storage Minutes
    // ──────────────────────────────────────────────────────────────────

    /**
     * Get total minutes of video currently stored for an owner.
     */
    public function getStorageMinutesUsed(Model $owner): int
    {
        return (int) ($owner->storage_minutes_used ?? 0);
    }

    /**
     * Get storage minutes limit for an owner.
     * Returns null for unlimited.
     */
    public function getStorageMinutesLimit(Model $owner): ?int
    {
        $limit = $owner->storage_minutes_limit ?? null;

        return $limit !== null ? (int) $limit : null;
    }

    /**
     * Assert that the owner has enough remaining storage quota.
     *
     * @param  int  $estimatedDurationMinutes  Estimated duration of the video to upload
     *
     * @throws AuthorizationException
     */
    public function assertCanUpload(Model $owner, int $estimatedDurationMinutes): void
    {
        $limit = $this->getStorageMinutesLimit($owner);

        // null = unlimited
        if ($limit === null) {
            return;
        }

        $used = $this->getStorageMinutesUsed($owner);
        $remaining = max(0, $limit - $used);

        if ($estimatedDurationMinutes > $remaining) {
            throw new AuthorizationException(
                "تجاوزت حصة التخزين المسموحة ({$limit} دقيقة). " .
                "المستخدم: {$used} دقيقة، المتبقي: {$remaining} دقيقة."
            );
        }
    }

    /**
     * Increment storage minutes after a video is confirmed ready.
     */
    public function incrementStorageUsage(Model $owner, int $minutes): void
    {
        if ($minutes <= 0) {
            return;
        }

        if (method_exists($owner, 'tenantPlan')) {
            $owner->tenantPlan()->increment('storage_minutes_used', $minutes);

            return;
        }

        $owner->increment('storage_minutes_used', $minutes);
    }

    /**
     * Decrement storage minutes after a video is deleted.
     * Clamps to zero to avoid negative values.
     */
    public function decrementStorageUsage(Model $owner, int $minutes): void
    {
        if ($minutes <= 0) {
            return;
        }

        if (method_exists($owner, 'tenantPlan')) {
            DB::table('tenant_plans')
                ->where('tenant_id', $owner->id)
                ->where('tenant_type', $owner->getMorphClass())
                ->update([
                    'storage_minutes_used' => DB::raw("GREATEST(0, CAST(storage_minutes_used AS SIGNED) - {$minutes})"),
                ]);
        } else {
            DB::statement(
                'UPDATE ' . $owner->getTable() .
                ' SET storage_minutes_used = GREATEST(0, storage_minutes_used - ?) WHERE id = ?',
                [$minutes, $owner->getKey()]
            );
        }

        $owner->refresh();
    }

    // ──────────────────────────────────────────────────────────────────
    // Delivery Minutes
    // ──────────────────────────────────────────────────────────────────

    /**
     * Get delivery minutes used this billing period.
     */
    public function getDeliveryMinutesUsed(Model $owner): int
    {
        return (int) ($owner->delivery_minutes_used ?? 0);
    }

    /**
     * Get delivery minutes limit. Returns null for unlimited.
     */
    public function getDeliveryMinutesLimit(Model $owner): ?int
    {
        $limit = $owner->delivery_minutes_limit ?? null;

        return $limit !== null ? (int) $limit : null;
    }

    /**
     * Sync delivery usage from Cloudflare Analytics API.
     *
     * This should be run periodically (e.g. hourly via scheduler)
     * to keep local delivery counters in sync with actual CF usage.
     */
    public function syncDeliveryUsageFromAnalytics(Model $owner): void
    {
        [$ownerType, $ownerId] = $this->resolveOwnerTypeAndId($owner);

        // Get all video UIDs belonging to this owner
        $videoUids = Video::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->whereNotNull('stream_uid')
            ->pluck('stream_uid')
            ->toArray();

        if (empty($videoUids)) {
            return;
        }

        // Get current billing period dates
        $since = now()->startOfMonth()->toDateString();
        $until = now()->toDateString();

        $totalMinutes = 0.0;

        // Query analytics for each video (batched in practice)
        foreach ($videoUids as $uid) {
            $analytics = $this->stream->getVideoAnalytics($uid, $since, $until);
            $totalMinutes += $analytics['minutes_viewed'];
        }

        $minutesInt = (int) ceil($totalMinutes);

        if (method_exists($owner, 'tenantPlan')) {
            $owner->tenantPlan()->update(['delivery_minutes_used' => $minutesInt]);
        } else {
            $owner->forceFill(['delivery_minutes_used' => $minutesInt])->save();
        }
    }

    /**
     * Reset delivery minutes counter (called at billing period start).
     */
    public function resetDeliveryUsage(Model $owner): void
    {
        if (method_exists($owner, 'tenantPlan')) {
            $owner->tenantPlan()->update(['delivery_minutes_used' => 0]);
        } else {
            $owner->forceFill(['delivery_minutes_used' => 0])->save();
        }
    }

    /**
     * Recalculate actual storage usage from DB (duration_seconds of all videos).
     */
    public function recalculateStorageUsage(Model $owner): int
    {
        [$ownerType, $ownerId] = $this->resolveOwnerTypeAndId($owner);

        $totalSeconds = (int) Video::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->whereNotNull('stream_uid')
            ->sum('duration_seconds');

        $totalMinutes = (int) ceil($totalSeconds / 60);

        $owner->forceFill(['storage_minutes_used' => $totalMinutes])->save();

        return $totalMinutes;
    }

    // ──────────────────────────────────────────────────────────────────
    // Snapshot (for API responses)
    // ──────────────────────────────────────────────────────────────────

    /**
     * Return a complete quota snapshot suitable for API responses.
     *
     * @return array{
     *   storage_minutes_used: int,
     *   storage_minutes_limit: int|null,
     *   storage_remaining: int|null,
     *   storage_percentage: float,
     *   storage_is_unlimited: bool,
     *   delivery_minutes_used: int,
     *   delivery_minutes_limit: int|null,
     *   delivery_remaining: int|null,
     *   delivery_percentage: float,
     *   delivery_is_unlimited: bool,
     * }
     */
    public function getQuotaSnapshot(Model $owner): array
    {
        $storageUsed  = $this->getStorageMinutesUsed($owner);
        $storageLimit = $this->getStorageMinutesLimit($owner);
        $storageUnlimited = $storageLimit === null;

        $deliveryUsed  = $this->getDeliveryMinutesUsed($owner);
        $deliveryLimit = $this->getDeliveryMinutesLimit($owner);
        $deliveryUnlimited = $deliveryLimit === null;

        return [
            'storage_minutes_used'   => $storageUsed,
            'storage_minutes_limit'  => $storageLimit,
            'storage_remaining'      => $storageUnlimited ? null : max(0, $storageLimit - $storageUsed),
            'storage_percentage'     => (! $storageUnlimited && $storageLimit > 0)
                ? round(min(100.0, ($storageUsed / $storageLimit) * 100), 2)
                : 0.0,
            'storage_is_unlimited'   => $storageUnlimited,

            'delivery_minutes_used'  => $deliveryUsed,
            'delivery_minutes_limit' => $deliveryLimit,
            'delivery_remaining'     => $deliveryUnlimited ? null : max(0, $deliveryLimit - $deliveryUsed),
            'delivery_percentage'    => (! $deliveryUnlimited && $deliveryLimit > 0)
                ? round(min(100.0, ($deliveryUsed / $deliveryLimit) * 100), 2)
                : 0.0,
            'delivery_is_unlimited'  => $deliveryUnlimited,
        ];
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    /**
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
            'StreamQuotaService only supports Teacher and Academy models; got ' . $owner::class
        );
    }
}
