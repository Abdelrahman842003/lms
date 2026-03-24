<?php

namespace App\Domains\Application\Rules;

use App\Domains\Application\Services\InputSanitizer;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SanitizedHtml implements ValidationRule
{
    protected InputSanitizer $sanitizer;

    /**
     * Threshold for detecting significant content removal (percentage)
     */
    protected float $removalThreshold;

    public function __construct(float $removalThreshold = 0.5)
    {
        $this->sanitizer = app(InputSanitizer::class);
        $this->removalThreshold = $removalThreshold;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        $sanitized = $this->sanitizer->sanitizeHtml($value);
        
        // Check if sanitization removed significant content (potential XSS attempt)
        if (strlen($sanitized) < strlen($value) * $this->removalThreshold) {
            $fail('The :attribute contains potentially unsafe content that was removed during sanitization.');
        }
    }
}

/**
 * Usage Examples:
 * 
 * In a FormRequest:
 * 
 * public function rules(): array
 * {
 *     return [
 *         'content' => ['required', 'string', new SanitizedHtml()],
 *         'description' => ['nullable', 'string', new SanitizedHtml(0.3)], // More strict threshold
 *     ];
 * }
 * 
 * Inline validation:
 * 
 * $validated = $request->validate([
 *     'body' => ['required', new \App\Domains\Application\Rules\SanitizedHtml()],
 * ]);
 */
