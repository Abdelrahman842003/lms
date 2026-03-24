#!/usr/bin/env php
<?php

/**
 * Mass Assignment Security Audit Script
 * 
 * This script scans all Eloquent models in the Laravel application and identifies
 * potentially sensitive fields that are mass-assignable ($fillable). It helps
 * identify security vulnerabilities where users could modify sensitive fields
 * through form submissions.
 * 
 * Usage:
 *   php backend/scripts/audit_mass_assignment.php
 * 
 * Options:
 *   --json     Output results in JSON format
 *   --fix      Show suggested fixes for each vulnerable model
 *   --strict   Also flag potentially sensitive fields (requires manual review)
 */

// Define sensitive fields that should NEVER be mass-assignable
const CRITICAL_SENSITIVE_FIELDS = [
    // Administrative flags
    'is_admin',
    'is_super_admin',
    'is_active',
    'is_verified',
    'is_approved',
    'is_suspended',
    'is_independent_active',

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

// Potentially sensitive fields that require manual review
const POTENTIALLY_SENSITIVE_FIELDS = [
    'academy_id',
    'teacher_id',
    'guardian_id',
    'student_id',
    'confirmation_code',
    'received_by_id',
    'received_by_type',
    'confirmed_at',
    'payment_initiated_at',
    'trial_period_days',
];

/**
 * Find all PHP files containing Eloquent models
 */
function findModelFiles(string $directory): array
{
    $models = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if (!$file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        
        // Check if file contains a model class
        if (preg_match('/class\s+\w+\s+extends\s+(Model|Authenticatable)/', $content)) {
            $models[] = $file->getPathname();
        }
    }

    return $models;
}

/**
 * Extract $fillable array from a model file
 */
function extractFillable(string $filePath): ?array
{
    $content = file_get_contents($filePath);
    
    // Match $fillable array - handles multi-line arrays
    if (preg_match('/protected\s+\$fillable\s*=\s*\[([\s\S]*?)\];/', $content, $matches)) {
        $fillableContent = $matches[1];
        
        // Extract all quoted strings
        preg_match_all("/'([^']+)'/", $fillableContent, $fieldMatches);
        
        return $fieldMatches[1] ?? [];
    }
    
    return null;
}

/**
 * Check if model uses GuardsSensitiveFields trait
 */
function usesGuardsSensitiveFields(string $filePath): bool
{
    $content = file_get_contents($filePath);
    return preg_match('/use\s+GuardsSensitiveFields/', $content) === 1;
}

/**
 * Get the class name from a file path
 */
function getClassName(string $filePath): string
{
    $content = file_get_contents($filePath);
    if (preg_match('/class\s+(\w+)\s+extends/', $content, $matches)) {
        return $matches[1];
    }
    return basename($filePath, '.php');
}

/**
 * Get relative path for display
 */
function getRelativePath(string $filePath): string
{
    $cwd = getcwd();
    return str_replace($cwd . '/', '', $filePath);
}

/**
 * Analyze a model for mass assignment vulnerabilities
 */
function analyzeModel(string $filePath, bool $strict = false): array
{
    $className = getClassName($filePath);
    $fillable = extractFillable($filePath);
    $hasTrait = usesGuardsSensitiveFields($filePath);
    
    $criticalIssues = [];
    $potentialIssues = [];
    
    if ($fillable !== null) {
        foreach ($fillable as $field) {
            if (in_array($field, CRITICAL_SENSITIVE_FIELDS)) {
                $criticalIssues[] = $field;
            } elseif ($strict && in_array($field, POTENTIALLY_SENSITIVE_FIELDS)) {
                $potentialIssues[] = $field;
            }
        }
    }
    
    return [
        'class' => $className,
        'file' => getRelativePath($filePath),
        'has_trait' => $hasTrait,
        'fillable' => $fillable ?? [],
        'critical_issues' => $criticalIssues,
        'potential_issues' => $potentialIssues,
        'is_vulnerable' => count($criticalIssues) > 0 || count($potentialIssues) > 0,
    ];
}

/**
 * Generate fix suggestion for a model
 */
function generateFixSuggestion(array $analysis): string
{
    $allIssues = array_merge($analysis['critical_issues'], $analysis['potential_issues']);
    
    if (empty($allIssues)) {
        return '';
    }
    
    $safeFillable = array_diff($analysis['fillable'], $allIssues);
    
    $suggestion = "\n  // BEFORE (Vulnerable):\n";
    $suggestion .= "  protected \$fillable = [\n";
    foreach ($analysis['fillable'] as $field) {
        $marker = in_array($field, $allIssues) ? ' // <-- SENSITIVE!' : '';
        $suggestion .= "      '{$field}',{$marker}\n";
    }
    $suggestion .= "  ];\n";
    
    $suggestion .= "\n  // AFTER (Secure):\n";
    $suggestion .= "  use GuardsSensitiveFields;\n\n";
    $suggestion .= "  protected \$fillable = [\n";
    foreach ($safeFillable as $field) {
        $suggestion .= "      '{$field}',\n";
    }
    $suggestion .= "  ];\n";
    $suggestion .= "  // Sensitive fields ({$analysis['class']}: " . implode(', ', $allIssues) . ") are automatically guarded\n";
    
    return $suggestion;
}

/**
 * Output results in human-readable format
 */
function outputHumanReadable(array $results, bool $showFixes = false): void
{
    $vulnerableModels = array_filter($results, fn($r) => $r['is_vulnerable']);
    $secureModels = array_filter($results, fn($r) => !$r['is_vulnerable'] && $r['has_trait']);
    $unprotectedModels = array_filter($results, fn($r) => !$r['is_vulnerable'] && !$r['has_trait'] && $r['fillable']);
    
    echo "\n" . str_repeat('=', 80) . "\n";
    echo "MASS ASSIGNMENT SECURITY AUDIT REPORT\n";
    echo str_repeat('=', 80) . "\n\n";
    
    // Summary
    echo "SUMMARY\n";
    echo str_repeat('-', 40) . "\n";
    echo "Total models scanned:    " . count($results) . "\n";
    echo "Vulnerable models:       " . count($vulnerableModels) . " ⚠️\n";
    echo "Secure (with trait):     " . count($secureModels) . " ✓\n";
    echo "Unprotected (no trait):  " . count($unprotectedModels) . "\n\n";
    
    if (count($vulnerableModels) > 0) {
        echo str_repeat('=', 80) . "\n";
        echo "🚨 VULNERABLE MODELS (Critical Issues Found)\n";
        echo str_repeat('=', 80) . "\n\n";
        
        foreach ($vulnerableModels as $result) {
            echo "📁 {$result['class']}\n";
            echo "   File: {$result['file']}\n";
            echo "   Uses GuardsSensitiveFields: " . ($result['has_trait'] ? 'Yes ✓' : 'No ✗') . "\n";
            
            if (!empty($result['critical_issues'])) {
                echo "   🔴 CRITICAL sensitive fields in \$fillable:\n";
                foreach ($result['critical_issues'] as $field) {
                    echo "      - {$field}\n";
                }
            }
            
            if (!empty($result['potential_issues'])) {
                echo "   🟡 Potentially sensitive fields in \$fillable:\n";
                foreach ($result['potential_issues'] as $field) {
                    echo "      - {$field}\n";
                }
            }
            
            if ($showFixes) {
                echo "\n" . generateFixSuggestion($result);
            }
            
            echo "\n";
        }
    }
    
    if (count($unprotectedModels) > 0) {
        echo str_repeat('=', 80) . "\n";
        echo "⚠️  UNPROTECTED MODELS (No GuardsSensitiveFields trait)\n";
        echo str_repeat('=', 80) . "\n\n";
        
        foreach ($unprotectedModels as $result) {
            echo "📁 {$result['class']}\n";
            echo "   File: {$result['file']}\n";
            echo "   \$fillable fields: " . implode(', ', $result['fillable']) . "\n\n";
        }
    }
    
    if (count($secureModels) > 0) {
        echo str_repeat('=', 80) . "\n";
        echo "✓ SECURE MODELS (Using GuardsSensitiveFields)\n";
        echo str_repeat('=', 80) . "\n\n";
        
        foreach ($secureModels as $result) {
            echo "✓ {$result['class']}\n";
        }
        echo "\n";
    }
    
    // Recommendations
    echo str_repeat('=', 80) . "\n";
    echo "RECOMMENDATIONS\n";
    echo str_repeat('=', 80) . "\n\n";
    
    if (count($vulnerableModels) > 0) {
        echo "1. CRITICAL: Fix vulnerable models immediately:\n";
        echo "   - Add 'use GuardsSensitiveFields;' trait to each vulnerable model\n";
        echo "   - Remove sensitive fields from \$fillable arrays\n";
        echo "   - Set sensitive fields explicitly: \$model->password = Hash::make(\$value);\n\n";
    }
    
    if (count($unprotectedModels) > 0) {
        echo "2. Consider adding GuardsSensitiveFields trait to all models with \$fillable\n";
        echo "   for consistent protection across the application.\n\n";
    }
    
    echo "3. Regular audits:\n";
    echo "   - Run this script regularly to catch new vulnerabilities\n";
    echo "   - Review any new fields added to \$fillable arrays\n";
    echo "   - Ensure code reviews check for mass assignment issues\n\n";
    
    echo str_repeat('=', 80) . "\n";
}

/**
 * Output results in JSON format
 */
function outputJson(array $results): void
{
    echo json_encode([
        'timestamp' => date('c'),
        'summary' => [
            'total_models' => count($results),
            'vulnerable_models' => count(array_filter($results, fn($r) => $r['is_vulnerable'])),
            'secure_models' => count(array_filter($results, fn($r) => !$r['is_vulnerable'] && $r['has_trait'])),
        ],
        'results' => $results,
    ], JSON_PRETTY_PRINT);
}

// Main execution
$options = getopt('', ['json', 'fix', 'strict']);

$backendPath = dirname(__DIR__);
$domainsPath = $backendPath . '/app/Domains';

echo "Scanning for Eloquent models...\n";

$models = [];

// Scan Domains directory
if (is_dir($domainsPath)) {
    $domainModels = findModelFiles($domainsPath);
    $models = array_merge($models, $domainModels);
}

// Analyze all models
$results = [];
foreach ($models as $modelFile) {
    $results[] = analyzeModel($modelFile, isset($options['strict']));
}

// Sort results: vulnerable first, then unprotected, then secure
usort($results, function ($a, $b) {
    if ($a['is_vulnerable'] && !$b['is_vulnerable']) return -1;
    if (!$a['is_vulnerable'] && $b['is_vulnerable']) return 1;
    if (!$a['has_trait'] && $b['has_trait']) return -1;
    if ($a['has_trait'] && !$b['has_trait']) return 1;
    return strcmp($a['class'], $b['class']);
});

// Output results
if (isset($options['json'])) {
    outputJson($results);
} else {
    outputHumanReadable($results, isset($options['fix']));
}

// Exit with error code if vulnerabilities found
$vulnerableCount = count(array_filter($results, fn($r) => $r['is_vulnerable']));
exit($vulnerableCount > 0 ? 1 : 0);
