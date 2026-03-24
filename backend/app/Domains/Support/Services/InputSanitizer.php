<?php

namespace App\Domains\Support\Services;

use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Support\Str;

class InputSanitizer
{
    protected HTMLPurifier $purifier;
    
    protected array $allowedTags = [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i',
        'ul', 'ol', 'li', 'a', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ];
    
    protected array $allowedAttributes = [
        'a.href', 'a.title', 'span.class', 'div.class',
    ];

    public function __construct()
    {
        $config = HTMLPurifier_Config::createDefault();
        $config->set('HTML.Allowed', $this->getAllowedTagsConfig());
        $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true, 'mailto' => true]);
        $config->set('HTML.TargetBlank', true);
        $config->set('AutoFormat.RemoveEmpty', true);
        $config->set('AutoFormat.RemoveSpansWithoutAttributes', true);
        
        $this->purifier = new HTMLPurifier($config);
    }

    /**
     * Sanitize HTML content (for rich text fields)
     */
    public function sanitizeHtml(?string $content): ?string
    {
        if ($content === null) {
            return null;
        }
        
        return $this->purifier->purify($content);
    }

    /**
     * Strip all HTML tags (for plain text fields)
     */
    public function stripTags(?string $content): ?string
    {
        if ($content === null) {
            return null;
        }
        
        return strip_tags($content);
    }

    /**
     * Escape HTML entities
     */
    public function escape(?string $content): ?string
    {
        if ($content === null) {
            return null;
        }
        
        return htmlspecialchars($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Sanitize a string for safe display
     */
    public function clean(?string $content, bool $allowHtml = false): ?string
    {
        if ($content === null) {
            return null;
        }
        
        // Remove null bytes and other invisible characters
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $content);
        
        // Normalize whitespace
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Trim
        $content = trim($content);
        
        if ($allowHtml) {
            return $this->sanitizeHtml($content);
        }
        
        return $this->stripTags($content);
    }

    /**
     * Sanitize an array of data
     */
    public function sanitizeArray(array $data, array $rules = []): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            $allowHtml = $rules[$key] ?? false;
            
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value, $rules[$key] ?? []);
            } elseif (is_string($value)) {
                $sanitized[$key] = $this->clean($value, $allowHtml);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }

    /**
     * Remove potentially dangerous characters from filename
     */
    public function sanitizeFilename(string $filename): string
    {
        // Remove path traversal
        $filename = basename($filename);
        
        // Remove null bytes
        $filename = str_replace(chr(0), '', $filename);
        
        // Remove dangerous characters
        $filename = preg_replace('/[^\w\.\-]/', '_', $filename);
        
        // Prevent double extensions
        $filename = preg_replace('/\.(?=.*\.)/', '_', $filename);
        
        return $filename;
    }

    /**
     * Sanitize URL
     */
    public function sanitizeUrl(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }
        
        // Only allow safe protocols
        $allowedProtocols = ['http', 'https', 'mailto'];
        $protocol = parse_url($url, PHP_URL_SCHEME);
        
        if ($protocol && !in_array(strtolower($protocol), $allowedProtocols)) {
            return null;
        }
        
        return filter_var($url, FILTER_SANITIZE_URL) ?: null;
    }

    protected function getAllowedTagsConfig(): string
    {
        $tags = [];
        
        foreach ($this->allowedTags as $tag) {
            $attributes = array_filter($this->allowedAttributes, fn($attr) => str_starts_with($attr, $tag . '.'));
            $attrs = array_map(fn($attr) => str_replace($tag . '.', '', $attr), $attributes);
            
            if (empty($attrs)) {
                $tags[] = $tag;
            } else {
                $tags[] = $tag . '[' . implode(',', $attrs) . ']';
            }
        }
        
        return implode(',', $tags);
    }
}
