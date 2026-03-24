<?php

namespace App\Domains\Application\Http\Middleware;

use App\Domains\Support\Services\InputSanitizer;
use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    protected InputSanitizer $sanitizer;
    
    /**
     * Fields that are allowed to contain HTML content
     */
    protected array $htmlFields = [
        'content',
        'description',
        'body',
        'message',
        'notes',
        'answer',
        'question_text',
        'feedback',
        'comment',
        'bio',
        'address',
    ];

    public function __construct(InputSanitizer $sanitizer)
    {
        $this->sanitizer = $sanitizer;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip sanitization for file upload requests to avoid processing binary data
        if ($request->hasFile('*')) {
            return $next($request);
        }

        if ($request->isJson()) {
            $this->sanitizeJson($request);
        } else {
            $this->sanitizeInput($request);
        }

        return $next($request);
    }

    /**
     * Sanitize regular input data
     */
    protected function sanitizeInput(Request $request): void
    {
        $input = $request->all();
        
        if (!empty($input)) {
            $sanitized = $this->sanitizer->sanitizeArray($input, $this->getHtmlRules($input));
            $request->replace($sanitized);
        }
    }

    /**
     * Sanitize JSON request body
     */
    protected function sanitizeJson(Request $request): void
    {
        $json = $request->json()->all();
        
        if (is_array($json) && !empty($json)) {
            $sanitized = $this->sanitizer->sanitizeArray($json, $this->getHtmlRules($json));
            $request->json()->replace($sanitized);
        }
    }

    /**
     * Get HTML allow rules for the current request data
     */
    protected function getHtmlRules(array $data): array
    {
        $rules = [];
        
        foreach ($this->htmlFields as $field) {
            if (array_key_exists($field, $data)) {
                $rules[$field] = true; // Allow HTML for this field
            }
        }
        
        // Also check nested data for HTML fields
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                foreach ($this->htmlFields as $field) {
                    if (array_key_exists($field, $value)) {
                        $rules[$key][$field] = true;
                    }
                }
            }
        }
        
        return $rules;
    }
}
