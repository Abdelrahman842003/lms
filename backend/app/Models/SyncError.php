<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SyncError extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'client_side_uuid',
        'operation_type',
        'payload',
        'error_message',
        'error_code',
        'user_id',
        'user_type',
        'resolved',
        'resolved_by',
        'resolved_at',
        'resolution_notes',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'resolved' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    // ===================
    // Scopes
    // ===================

    /**
     * Get unresolved errors
     */
    public function scopeUnresolved($query)
    {
        return $query->where('resolved', false);
    }

    /**
     * Get resolved errors
     */
    public function scopeResolved($query)
    {
        return $query->where('resolved', true);
    }

    /**
     * Filter by operation type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('operation_type', $type);
    }

    /**
     * Filter by user
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ===================
    // Methods
    // ===================

    /**
     * Mark error as resolved
     */
    public function markResolved(string $resolvedBy, ?string $notes = null): bool
    {
        return $this->update([
            'resolved' => true,
            'resolved_by' => $resolvedBy,
            'resolved_at' => now(),
            'resolution_notes' => $notes,
        ]);
    }
}
