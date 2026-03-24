<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Trait HasOwnershipScopes
 * 
 * Provides reusable query scopes for enforcing ownership boundaries.
 * Use this trait on models that need IDOR protection.
 * 
 * @example
 * // In a model:
 * class Video extends Model {
 *     use HasOwnershipScopes;
 * }
 * 
 * // In a controller/service:
 * Video::forAcademy($academyId)->findOrFail($id);
 * Video::forTeacher($teacherId)->where('status', 'published')->get();
 */
trait HasOwnershipScopes
{
    /**
     * Scope query to resources owned by a specific user.
     * 
     * @param Builder $query
     * @param int $userId The user ID to filter by
     * @param string $column The column name to check (default: 'user_id')
     * @return Builder
     */
    public function scopeOwnedBy(Builder $query, int $userId, string $column = 'user_id'): Builder
    {
        return $query->where($column, $userId);
    }

    /**
     * Scope query to resources belonging to a specific teacher.
     * 
     * If no teacher ID is provided, uses the authenticated user's teacher relationship.
     * 
     * @param Builder $query
     * @param int|null $teacherId The teacher ID to filter by (optional, uses auth user if null)
     * @return Builder
     */
    public function scopeForTeacher(Builder $query, ?int $teacherId = null): Builder
    {
        $teacherId = $teacherId ?? Auth::user()?->teacher?->id;
        
        if ($teacherId === null) {
            // Return an impossible condition to prevent data leakage
            return $query->whereRaw('1 = 0');
        }
        
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Scope query to resources belonging to a specific academy.
     * 
     * If no academy ID is provided, uses the authenticated user's academy relationship.
     * 
     * @param Builder $query
     * @param int|null $academyId The academy ID to filter by (optional, uses auth user if null)
     * @return Builder
     */
    public function scopeForAcademy(Builder $query, ?int $academyId = null): Builder
    {
        $academyId = $academyId ?? Auth::user()?->academy?->id;
        
        if ($academyId === null) {
            // Return an impossible condition to prevent data leakage
            return $query->whereRaw('1 = 0');
        }
        
        return $query->where('academy_id', $academyId);
    }

    /**
     * Scope to include ownership check for the authenticated user.
     * 
     * This scope handles the complex case where a resource might be owned by:
     * - The user directly (user_id column)
     * - The user's academy (academy_id column)
     * - The user's teacher profile (teacher_id column)
     * 
     * @param Builder $query
     * @param string $userColumn The column to check for direct user ownership (default: 'user_id')
     * @return Builder
     */
    public function scopeOwnedOrOwnedByAcademy(Builder $query, string $userColumn = 'user_id'): Builder
    {
        $user = Auth::user();
        
        if (!$user) {
            // Return an impossible condition to prevent data leakage
            return $query->whereRaw('1 = 0');
        }
        
        // Check if user is an Academy
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            return $query->where('academy_id', $user->academy->id ?? $user->id);
        }
        
        // Check if user is a Teacher
        if (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            return $query->where(function ($q) use ($user, $userColumn) {
                $q->where($userColumn, $user->id)
                    ->orWhereHas('teacher', fn($subQ) => $subQ->where('id', $user->teacher->id));
            });
        }
        
        // Default: direct user ownership
        return $query->where($userColumn, $user->id);
    }

    /**
     * Scope to find a resource by ID with ownership validation.
     * 
     * This combines the find and ownership check in a single method.
     * Returns null if not found or not owned.
     * 
     * @param Builder $query
     * @param int|string $id The resource ID to find
     * @param int|null $ownerId The owner ID to validate (optional, uses auth user if null)
     * @param string $ownerColumn The column to check for ownership (default: 'user_id')
     * @return Builder
     */
    public function scopeFindOwned(Builder $query, int|string $id, ?int $ownerId = null, string $ownerColumn = 'user_id'): Builder
    {
        $query->where('id', $id);
        
        if ($ownerId !== null) {
            $query->where($ownerColumn, $ownerId);
        }
        
        return $query;
    }

    /**
     * Scope to filter resources accessible by a teacher (either owned or via academy).
     * 
     * This is useful for teachers who may have resources they created personally
     * or resources shared through their academy.
     * 
     * @param Builder $query
     * @param int $teacherId The teacher ID
     * @param int|null $academyId The academy ID (optional)
     * @return Builder
     */
    public function scopeAccessibleByTeacher(Builder $query, int $teacherId, ?int $academyId = null): Builder
    {
        return $query->where(function ($q) use ($teacherId, $academyId) {
            $q->where('teacher_id', $teacherId);
            
            if ($academyId !== null) {
                $q->orWhere('academy_id', $academyId);
            }
        });
    }

    /**
     * Scope to filter resources that belong to a specific academy context.
     * 
     * This handles both direct academy ownership and teacher resources
     * that are associated with an academy.
     * 
     * @param Builder $query
     * @param int $academyId The academy ID
     * @return Builder
     */
    public function scopeInAcademyContext(Builder $query, int $academyId): Builder
    {
        return $query->where(function ($q) use ($academyId) {
            $q->where('academy_id', $academyId)
                ->orWhereHas('teacher', fn($subQ) => $subQ->where('academy_id', $academyId));
        });
    }
}
