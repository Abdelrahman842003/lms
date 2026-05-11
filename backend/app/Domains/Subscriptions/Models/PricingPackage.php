<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PricingPackage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name_ar',
        'name_en',
        'max_students',
        'storage_limit_gb',
        'price',
        'discount_percentage',
        'half_yearly_price',
        'half_yearly_discount_percentage',
        'yearly_price',
        'yearly_discount_percentage',
        'features',
        'is_active',
        'is_popular',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'half_yearly_price' => 'decimal:2',
        'half_yearly_discount_percentage' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'yearly_discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
        'max_students' => 'integer',
        'storage_limit_gb' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Scope for active packages.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
