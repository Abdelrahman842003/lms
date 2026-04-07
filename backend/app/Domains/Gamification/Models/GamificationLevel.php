<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GamificationLevel extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'icon',
        'color',
        'min_points',
        'max_points',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'min_points' => 'integer',
            'max_points' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Check if this is the last (highest) level
     */
    public function isLastLevel(): bool
    {
        return $this->max_points === null;
    }

    /**
     * Check if a given point total falls within this level's range
     */
    public function containsPoints(int $points): bool
    {
        return $points >= $this->min_points
            && ($this->max_points === null || $points <= $this->max_points);
    }

    /**
     * Find the appropriate level for a given point total
     */
    public static function findForPoints(int $points): ?self
    {
        return static::where('min_points', '<=', $points)
            ->where(fn ($q) => $q->where('max_points', '>=', $points)->orWhereNull('max_points'))
            ->orderByDesc('sort_order')
            ->first();
    }

    /**
     * Get the next level after this one
     */
    public function getNextLevel(): ?self
    {
        return static::where('sort_order', $this->sort_order + 1)->first();
    }

    /**
     * Get all levels ordered by sort_order
     */
    public static function allOrdered()
    {
        return static::orderBy('sort_order')->get();
    }

    /**
     * Students currently at this level
     */
    public function students(): HasMany
    {
        return $this->hasMany(\App\Domains\Auth\Models\Student::class, 'current_level_id');
    }

    /**
     * Level history entries for this level
     */
    public function levelHistories(): HasMany
    {
        return $this->hasMany(StudentLevelHistory::class, 'level_id');
    }
}
