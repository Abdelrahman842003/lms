<?php

use App\Domains\Application\Services\InputSanitizer;

if (!function_exists('clean_input')) {
    /**
     * Sanitize input string
     */
    function clean_input(?string $value, bool $allowHtml = false): ?string
    {
        return app(InputSanitizer::class)->clean($value, $allowHtml);
    }
}

if (!function_exists('clean_html')) {
    /**
     * Sanitize HTML content
     */
    function clean_html(?string $value): ?string
    {
        return app(InputSanitizer::class)->sanitizeHtml($value);
    }
}

if (!function_exists('sanitize_array')) {
    /**
     * Sanitize an array of data
     */
    function sanitize_array(array $data, array $rules = []): array
    {
        return app(InputSanitizer::class)->sanitizeArray($data, $rules);
    }
}

if (!function_exists('sanitize_filename')) {
    /**
     * Sanitize a filename
     */
    function sanitize_filename(string $filename): string
    {
        return app(InputSanitizer::class)->sanitizeFilename($filename);
    }
}

if (!function_exists('sanitize_url')) {
    /**
     * Sanitize a URL
     */
    function sanitize_url(?string $url): ?string
    {
        return app(InputSanitizer::class)->sanitizeUrl($url);
    }
}

if (!function_exists('escape_html')) {
    /**
     * Escape HTML entities
     */
    function escape_html(?string $content): ?string
    {
        return app(InputSanitizer::class)->escape($content);
    }
}
