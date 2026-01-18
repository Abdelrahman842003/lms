<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AcademyBilling extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'academy_id',
        'month',
        'year',
        'total_students',
        'cost_per_student',
        'total_cost',
        'amount_paid',
        'status',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'total_students' => 'integer',
        'cost_per_student' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'paid_at' => 'date',
    ];

    /**
     * Academy relationship
     */
    public function academy()
    {
        return $this->belongsTo(Academy::class);
    }

    /**
     * Scope for pending billings
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for paid billings
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope for specific month/year
     */
    public function scopeForPeriod($query, int $month, int $year)
    {
        return $query->where('month', $month)->where('year', $year);
    }

    /**
     * Scope for filtering
     */
    public function scopeFilter($query, array $filters)
    {
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($month = $filters['month'] ?? null) {
            $query->where('month', $month);
        }

        if ($year = $filters['year'] ?? null) {
            $query->where('year', $year);
        }

        if ($academyId = $filters['academy_id'] ?? null) {
            $query->where('academy_id', $academyId);
        }
    }
}
