<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TenantPlan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'tenant_type',
        'trial_period_days',
        'plan_type',
        'subscription_period',
        'plan_expires_at',
        'plan_max_students',
        'storage_minutes_limit',
        'storage_minutes_used',
        'delivery_minutes_limit',
        'delivery_minutes_used',
        'storage_used_bytes',
        'is_unlimited_students',
        'subscription_fee',
        'discount_percent',
        'discount_type',
        'discount_scope',
        'paid_amount',
        'billing_notes',
    ];

    protected $casts = [
        'trial_period_days' => 'integer',
        'plan_expires_at' => 'date',
        'plan_max_students' => 'integer',
        'storage_minutes_limit' => 'integer',
        'storage_minutes_used' => 'integer',
        'delivery_minutes_limit' => 'integer',
        'delivery_minutes_used' => 'integer',
        'is_unlimited_students' => 'boolean',
        'subscription_fee' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'storage_used_bytes' => 'integer',
        'discount_percent' => 'decimal:2',
    ];

    /**
     * Get the parent tenant model (Academy or Teacher).
     */
    public function tenant()
    {
        return $this->morphTo();
    }
}
