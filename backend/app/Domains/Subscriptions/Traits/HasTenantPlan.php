<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Traits;

use App\Domains\Subscriptions\Models\TenantPlan;

trait HasTenantPlan
{
    /**
     * Temporal storage for plan fields before saving.
     */
    protected array $planAttributes = [];

    /**
     * Plan fields to be synchronized with the tenant_plans table.
     */
    protected static array $planFields = [
        'trial_period_days', 'plan_type', 'subscription_period', 'plan_expires_at',
        'plan_max_students', 'is_unlimited_students', 'subscription_fee',
        'paid_amount', 'storage_minutes_limit', 'storage_minutes_used',
        'delivery_minutes_limit', 'delivery_minutes_used', 'storage_used_bytes',
        'storage_limit_gb',
        'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
    ];

    /**
     * Boot the trait to handle the saved event.
     */
    protected static function bootHasTenantPlan()
    {
        $cleanup = function ($model) {
            // Get columns of the current model's table to avoid unsetting real columns
            $columns = \Illuminate\Support\Facades\Schema::getColumnListing($model->getTable());
            
            foreach (static::$planFields as $field) {
                if (array_key_exists($field, $model->attributes)) {
                    // Always store in planAttributes for synchronization
                    $model->planAttributes[$field] = $model->attributes[$field];
                    
                    // ONLY unset if the field is NOT a real column in the database table
                    // to avoid "Unknown column" errors during save.
                    if (!in_array($field, $columns)) {
                        unset($model->attributes[$field]);
                    }
                }
            }
        };

        static::saving($cleanup);
        static::creating($cleanup);
        static::updating($cleanup);

        static::saved(function ($model) {
            $planData = [];
            foreach (static::$planFields as $field) {
                // Get value either from planAttributes or directly from the model
                $val = $model->planAttributes[$field] ?? $model->getAttribute($field);
                if ($val !== null) {
                    $planData[$field] = $val;
                }
            }

            if (!empty($planData)) {
                $model->tenantPlan()->updateOrCreate(
                    ['tenant_id' => $model->id, 'tenant_type' => $model->getMorphClass()],
                    $planData
                );
            }

            // Clear subscription cache
            try {
                app(\App\Domains\Subscriptions\Services\SubscriptionRenewalService::class)->clearSubscriptionCache($model);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to clear subscription cache for {$model->getMorphClass()}: " . $e->getMessage());
            }
            
            // Clear temporal attributes
            $model->planAttributes = [];
        });
    }

    /**
     * Get the tenant plan associated with the model.
     */
    public function tenantPlan()
    {
        return $this->morphOne(TenantPlan::class, 'tenant')->withDefault();
    }

    /**
     * Override setAttribute to handle plan fields.
     */
    public function setAttribute($key, $value)
    {
        if (in_array($key, static::$planFields)) {
            $this->planAttributes[$key] = $value;
            // We don't unset here anymore to allow Eloquent to handle real columns
            // The 'saving' listener above will handle unsetting only if necessary.
        }

        return parent::setAttribute($key, $value);
    }

    /**
     * Override getAttribute to handle plan fields.
     */
    public function getAttribute($key)
    {
        if (in_array($key, static::$planFields)) {
            if (array_key_exists($key, $this->planAttributes)) {
                return $this->planAttributes[$key];
            }
            
            // Try to get from the relation, but avoid infinite loops
            $plan = $this->getRelationValue('tenantPlan');
            if ($plan && isset($plan->$key)) {
                return $plan->$key;
            }
        }

        return parent::getAttribute($key);
    }
}
