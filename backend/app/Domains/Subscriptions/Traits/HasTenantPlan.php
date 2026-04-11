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
        'paid_amount', 'storage_limit_gb', 'storage_used_bytes',
        'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
    ];

    /**
     * Boot the trait to handle the saved event.
     */
    protected static function bootHasTenantPlan()
    {
        $cleanup = function ($model) {
            foreach (static::$planFields as $field) {
                if (array_key_exists($field, $model->attributes)) {
                    $model->planAttributes[$field] = $model->attributes[$field];
                    unset($model->attributes[$field]);
                }
                // Also check and remove from original to be safe
                if (array_key_exists($field, $model->original)) {
                    unset($model->original[$field]);
                }
            }
        };

        static::saving($cleanup);
        static::creating($cleanup);
        static::updating($cleanup);

        static::saved(function ($model) {
            $planData = [];
            foreach (static::$planFields as $field) {
                if (array_key_exists($field, $model->planAttributes)) {
                    $planData[$field] = $model->planAttributes[$field];
                }
            }

            if (!empty($planData)) {
                $model->tenantPlan()->updateOrCreate(
                    ['tenant_id' => $model->id, 'tenant_type' => $model->getMorphClass()],
                    $planData
                );

                // Clear temporal storage after saving
                $model->planAttributes = array_diff_key($model->planAttributes, array_flip(static::$planFields));
            }
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
            // Also ensure it's removed from main attributes if it somehow got there
            if (isset($this->attributes[$key])) {
                unset($this->attributes[$key]);
            }
            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    /**
     * Override getAttribute/magic __get to handle plan fields.
     */
    public function getAttribute($key)
    {
        if (in_array($key, static::$planFields)) {
            // Return from planAttributes if already set (during creation/update)
            if (array_key_exists($key, $this->planAttributes)) {
                return $this->planAttributes[$key];
            }
            
            // Otherwise, get from relation (lazily or eagerly loaded)
            return $this->tenantPlan->$key;
        }

        return parent::getAttribute($key);
    }

    /**
     * Check if an attribute is set (for isset() or empty()).
     */
    public function __isset($key)
    {
        if (in_array($key, static::$planFields)) {
            return true;
        }

        return parent::__isset($key);
    }
}
