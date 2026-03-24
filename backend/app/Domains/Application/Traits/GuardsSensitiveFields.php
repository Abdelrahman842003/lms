<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

/**
 * Trait GuardsSensitiveFields
 *
 * Provides automatic protection for sensitive fields that should never be mass-assignable.
 * This trait overrides Laravel's mass assignment protection to always guard sensitive fields
 * regardless of the model's $fillable or $guarded configuration.
 *
 * Usage:
 *   class User extends Model {
 *       use GuardsSensitiveFields;
 *
 *       protected $fillable = ['name', 'email'];
 *       // Sensitive fields like is_admin, role, password are automatically guarded
 *   }
 *
 * For models with additional custom sensitive fields:
 *   protected array $customSensitiveFields = ['custom_role', 'special_permission'];
 */
trait GuardsSensitiveFields
{
    /**
     * Sensitive fields that should never be mass-assignable.
     * These are merged with $guarded and $customSensitiveFields.
     *
     * @var array<int, string>
     */
    protected array $sensitiveFields = [
        // Administrative flags
        'is_admin',
        'is_super_admin',
        'is_active',
        'is_verified',
        'is_approved',
        'is_suspended',

        // Role and permission fields
        'role',
        'user_type',
        'subscription_type',
        'permission_level',
        'access_level',
        'permissions',

        // Authentication secrets
        'password',
        'remember_token',
        'api_token',
        'two_factor_secret',
        'two_factor_recovery_codes',

        // Verification timestamps
        'email_verified_at',
        'phone_verified_at',

        // Financial fields
        'balance',
        'credits',
        'points',
        'total_points',
        'amount_due',
        'amount_paid',
        'subscription_fee',
        'paid_amount',

        // System-controlled relationships
        'academy_id',
        'teacher_id',

        // Payment/billing fields
        'stripe_id',
        'pm_type',
        'pm_last_four',
        'payment_method',
        'payment_key',

        // Status fields
        'status',

        // Plan/subscription fields that affect billing
        'plan_type',
        'plan_expires_at',
        'plan_max_students',
        'is_unlimited_students',
        'storage_limit_gb',
        'storage_used_bytes',
        'discount_percent',
    ];

    /**
     * Get the guarded attributes for the model.
     *
     * This method overrides Laravel's default getGuarded() to automatically
     * include sensitive fields in the guarded array.
     *
     * @return array<int, string>
     */
    public function getGuarded(): array
    {
        return array_unique(array_merge(
            $this->guarded ?? [],
            $this->sensitiveFields,
            $this->customSensitiveFields ?? []
        ));
    }

    /**
     * Determine if the given key is guardable.
     *
     * This method ensures that sensitive fields are always treated as guarded,
     * even if the model uses $fillable instead of $guarded.
     *
     * @param  string  $key
     * @return bool
     */
    public function isGuardableKey($key): bool
    {
        // Always guard sensitive fields
        if (in_array($key, $this->sensitiveFields, true)) {
            return true;
        }

        // Check custom sensitive fields if defined
        if (isset($this->customSensitiveFields) && in_array($key, $this->customSensitiveFields, true)) {
            return true;
        }

        // Fall back to parent implementation
        return parent::isGuardableKey($key);
    }

    /**
     * Get the fillable attributes for the model.
     *
     * This method filters out sensitive fields from the fillable array
     * to provide an extra layer of protection.
     *
     * @return array<int, string>
     */
    public function getFillable(): array
    {
        $fillable = parent::getFillable();

        // Remove any sensitive fields that might have been accidentally added to fillable
        return array_values(array_diff($fillable, $this->sensitiveFields, $this->customSensitiveFields ?? []));
    }

    /**
     * Check if a given attribute is sensitive.
     *
     * @param  string  $attribute
     * @return bool
     */
    public function isSensitiveField(string $attribute): bool
    {
        return in_array($attribute, $this->sensitiveFields, true) ||
            (isset($this->customSensitiveFields) && in_array($attribute, $this->customSensitiveFields, true));
    }

    /**
     * Get all sensitive fields for this model.
     *
     * @return array<int, string>
     */
    public function getSensitiveFields(): array
    {
        return array_unique(array_merge(
            $this->sensitiveFields,
            $this->customSensitiveFields ?? []
        ));
    }
}
