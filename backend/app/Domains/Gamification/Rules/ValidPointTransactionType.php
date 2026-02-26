<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Rules;

use App\Domains\Gamification\Enums\PointTransactionType;
use Illuminate\Contracts\Validation\Rule;

class ValidPointTransactionType implements Rule
{
    /**
     * Determine if the validation rule passes.
     */
    public function passes($attribute, $value): bool
    {
        return PointTransactionType::isValid($value);
    }

    /**
     * Get the validation error message.
     */
    public function message(): string
    {
        $validTypes = implode(', ', PointTransactionType::values());
        return "نوع المعاملة غير صحيح. الأنواع المسموحة: {$validTypes}";
    }
}
