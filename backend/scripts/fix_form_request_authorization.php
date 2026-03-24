#!/usr/bin/env php
<?php

/**
 * CVE-002 Auto-Update Script for Form Request Authorization
 *
 * This script scans all Form Request files in the backend directory,
 * identifies those with insecure `return true;` in authorize() method,
 * and suggests/updates based on naming conventions.
 *
 * Usage:
 *   php backend/scripts/fix_form_request_authorization.php [--dry-run] [--verbose] [--fix]
 *
 * Options:
 *   --dry-run    Show what would be changed without making changes (default)
 *   --verbose    Show detailed output for each file
 *   --fix        Actually apply the changes
 *
 * @author Security Audit Team
 * @version 1.0.0
 */

declare(strict_types=1);

// Configuration
$backendPath = dirname(__DIR__);
$dryRun = !in_array('--fix', $argv, true);
$verbose = in_array('--verbose', $argv, true);

// Model mapping based on naming conventions
$modelMapping = [
    'Student' => 'App\\Domains\\Auth\\Models\\Student',
    'Teacher' => 'App\\Domains\\Auth\\Models\\Teacher',
    'Academy' => 'App\\Domains\\Auth\\Models\\Academy',
    'Secretary' => 'App\\Domains\\Auth\\Models\\Secretary',
    'Guardian' => 'App\\Domains\\Auth\\Models\\Guardian',
    'Admin' => 'App\\Domains\\Auth\\Models\\Admin',
    'Lecture' => 'App\\Domains\\Lectures\\Models\\Lecture',
    'Video' => 'App\\Domains\\Videos\\Models\\Video',
    'Grade' => 'App\\Domains\\Enrollments\\Models\\Grade',
    'Group' => 'App\\Domains\\Enrollments\\Models\\Group',
    'Enrollment' => 'App\\Domains\\Enrollments\\Models\\Enrollment',
    'Exam' => 'App\\Domains\\Exams\\Models\\Exam',
    'Payment' => 'App\\Domains\\Payments\\Models\\Payment',
    'Attendance' => 'App\\Domains\\Lectures\\Models\\Attendance',
    'Notification' => 'App\\Domains\\Notifications\\Models\\Notification',
    'Subscription' => 'App\\Domains\\Subscriptions\\Models\\Subscription',
    'Permission' => 'Spatie\\Permission\\Models\\Permission',
    'Role' => 'Spatie\\Permission\\Models\\Role',
];

// Ability mapping based on request name prefixes
$abilityMapping = [
    'Store' => 'create',
    'Create' => 'create',
    'Update' => 'update',
    'Edit' => 'update',
    'Delete' => 'delete',
    'Destroy' => 'delete',
    'View' => 'view',
    'Show' => 'view',
    'Index' => 'viewAny',
    'List' => 'viewAny',
    'Export' => 'export',
    'Import' => 'import',
    'Sync' => 'sync',
    'Resolve' => 'resolve',
    'Mark' => 'mark',
    'Issue' => 'issue',
    'Confirm' => 'confirm',
    'Request' => 'request',
    'Send' => 'send',
    'Abort' => 'abort',
    'Complete' => 'complete',
    'Initiate' => 'initiate',
    'Upload' => 'upload',
    'Cancel' => 'cancel',
    'Record' => 'record',
    'Award' => 'award',
    'Bulk' => 'bulk',
];

// Files that require manual review (special cases)
$manualReviewFiles = [
    'LoginRequest',
    'RegisterRequest',
    'ChangePasswordRequest',
    'DashboardRequest',
    'SummaryRequest',
    'ReportRequest',
    'SearchByPhoneRequest',
    'CheckPhoneRequest',
];

// Statistics
$stats = [
    'total' => 0,
    'insecure' => 0,
    'already_secure' => 0,
    'updated' => 0,
    'manual_review' => 0,
    'skipped' => 0,
];

/**
 * Find all Form Request files in the backend directory.
 */
function findFormRequestFiles(string $path): array
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $content = file_get_contents($file->getPathname());
            if (preg_match('/extends\s+FormRequest\b/', $content)) {
                $files[] = $file->getPathname();
            }
        }
    }

    return $files;
}

/**
 * Check if a file has insecure authorization (return true;).
 */
function hasInsecureAuthorization(string $content): bool
{
    return (bool) preg_match('/public\s+function\s+authorize\s*\(\s*\)\s*:\s*bool\s*\{\s*return\s+true\s*;\s*\}/s', $content);
}

/**
 * Extract the class name from file content.
 */
function extractClassName(string $content): ?string
{
    if (preg_match('/class\s+(\w+Request)\s+extends/', $content, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Extract the namespace from file content.
 */
function extractNamespace(string $content): ?string
{
    if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Determine the model class based on the request name.
 */
function determineModelClass(string $className): ?string
{
    global $modelMapping;

    foreach ($modelMapping as $modelName => $modelClass) {
        if (str_contains($className, $modelName)) {
            return $modelClass;
        }
    }

    return null;
}

/**
 * Determine the ability based on the request name prefix.
 */
function determineAbility(string $className): ?string
{
    global $abilityMapping;

    foreach ($abilityMapping as $prefix => $ability) {
        if (str_starts_with($className, $prefix)) {
            return $ability;
        }
    }

    return null;
}

/**
 * Check if file needs manual review.
 */
function needsManualReview(string $className): bool
{
    global $manualReviewFiles;

    foreach ($manualReviewFiles as $pattern) {
        if (str_contains($className, $pattern)) {
            return true;
        }
    }

    return false;
}

/**
 * Generate the updated file content.
 */
function generateUpdatedContent(
    string $content,
    string $className,
    string $modelClass,
    string $ability,
    bool $checkInstance
): string {
    // Get description for checkInstance
    $instanceDescription = $checkInstance
        ? "True for 'update'/'delete' operations (requires model instance for policy)."
        : "False for 'create' operations (no model instance exists yet).";

    // Build the new use statements
    $useStatements = "use App\\Http\\Requests\\BaseAuthorizedRequest;\n";
    $useStatements .= "use " . $modelClass . ";";

    // Replace the use statement for FormRequest
    $content = preg_replace(
        '/use Illuminate\\\\Foundation\\\\Http\\\\FormRequest;/',
        $useStatements,
        $content
    );

    // Replace the class declaration
    $content = preg_replace(
        '/class\s+(\w+Request)\s+extends\s+FormRequest/',
        'class $1 extends BaseAuthorizedRequest',
        $content
    );

    // Build the new authorize configuration
    $authorizeConfig = '    /**' . "\n";
    $authorizeConfig .= '     * The ability name for authorization.' . "\n";
    $authorizeConfig .= '     */' . "\n";
    $authorizeConfig .= '    protected string $ability = \'' . $ability . '\';' . "\n\n";
    $authorizeConfig .= '    /**' . "\n";
    $authorizeConfig .= '     * The model class for policy checking.' . "\n";
    $authorizeConfig .= '     */' . "\n";
    $authorizeConfig .= '    protected string $modelClass = ' . $modelClass . '::class;' . "\n\n";
    $authorizeConfig .= '    /**' . "\n";
    $authorizeConfig .= '     * Whether to check against a specific model instance.' . "\n";
    $authorizeConfig .= '     * ' . $instanceDescription . "\n";
    $authorizeConfig .= '     */' . "\n";
    $authorizeConfig .= '    protected bool $checkInstance = ' . ($checkInstance ? 'true' : 'false') . ';';

    // Replace the authorize method with configuration properties
    $content = preg_replace(
        '/public\s+function\s+authorize\s*\(\s*\)\s*:\s*bool\s*\{[^}]*\}/s',
        $authorizeConfig,
        $content
    );

    return $content;
}

/**
 * Main execution.
 */
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║     CVE-002 Form Request Authorization Fix Script               ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

echo "Mode: " . ($dryRun ? "DRY RUN (no changes will be made)" : "FIX MODE (changes will be applied)") . "\n";
echo "Backend path: {$backendPath}\n\n";

// Find all Form Request files
$files = findFormRequestFiles($backendPath . '/app');
$stats['total'] = count($files);

echo "Found {$stats['total']} Form Request files.\n\n";

// Files needing manual review
$manualReviewList = [];

// Process each file
foreach ($files as $file) {
    $content = file_get_contents($file);
    $relativePath = str_replace($backendPath . '/', '', $file);
    $className = extractClassName($content);

    if (!$className) {
        if ($verbose) {
            echo "⚠️  Could not extract class name from: {$relativePath}\n";
        }
        $stats['skipped']++;
        continue;
    }

    // Check if already secure
    if (!hasInsecureAuthorization($content)) {
        $stats['already_secure']++;
        if ($verbose) {
            echo "✅ Already secure: {$className}\n";
        }
        continue;
    }

    $stats['insecure']++;

    // Check if needs manual review
    if (needsManualReview($className)) {
        $stats['manual_review']++;
        $manualReviewList[] = [
            'file' => $relativePath,
            'class' => $className,
            'reason' => 'Special authorization logic required',
        ];
        if ($verbose) {
            echo "📋 Manual review needed: {$className}\n";
        }
        continue;
    }

    // Determine model and ability
    $modelClass = determineModelClass($className);
    $ability = determineAbility($className);

    if (!$modelClass || !$ability) {
        $stats['manual_review']++;
        $manualReviewList[] = [
            'file' => $relativePath,
            'class' => $className,
            'reason' => "Could not determine model or ability from naming convention",
        ];
        if ($verbose) {
            echo "❓ Could not auto-detect: {$className} (model: " . ($modelClass ?? 'null') . ", ability: " . ($ability ?? 'null') . ")\n";
        }
        continue;
    }

    // Determine if instance check is needed
    $checkInstance = in_array($ability, ['update', 'delete', 'view']);

    if ($dryRun) {
        echo "📝 Would update: {$className}\n";
        echo "   - Model: {$modelClass}\n";
        echo "   - Ability: {$ability}\n";
        echo "   - Check instance: " . ($checkInstance ? 'true' : 'false') . "\n";
        echo "   - File: {$relativePath}\n\n";
    } else {
        // Generate updated content
        $namespace = extractNamespace($content);
        $updatedContent = generateUpdatedContent($content, $className, $modelClass, $ability, $checkInstance);
        
        // Apply the fix
        file_put_contents($file, $updatedContent);
        $stats['updated']++;
        echo "✅ Updated: {$className}\n";
        echo "   - Model: {$modelClass}\n";
        echo "   - Ability: {$ability}\n";
        echo "   - File: {$relativePath}\n\n";
    }
}

// Print summary
echo "\n";
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║                          SUMMARY                                ║\n";
echo "╠══════════════════════════════════════════════════════════════════╣\n";
printf("║ Total Form Requests:      %38d ║\n", $stats['total']);
printf("║ Already Secure:           %38d ║\n", $stats['already_secure']);
printf("║ Insecure (return true):   %38d ║\n", $stats['insecure']);
printf("║ %-25s %38d ║\n", $dryRun ? "Would Update:" : "Updated:", $stats['updated']);
printf("║ Need Manual Review:       %38d ║\n", $stats['manual_review']);
printf("║ Skipped:                  %38d ║\n", $stats['skipped']);
echo "╚══════════════════════════════════════════════════════════════════╝\n";

// Print files needing manual review
if (!empty($manualReviewList)) {
    echo "\n";
    echo "╔══════════════════════════════════════════════════════════════════╗\n";
    echo "║               FILES REQUIRING MANUAL REVIEW                     ║\n";
    echo "╠══════════════════════════════════════════════════════════════════╣\n";
    foreach ($manualReviewList as $item) {
        printf("║ %-64s ║\n", substr($item['class'], 0, 64));
        printf("║   File: %-55s ║\n", substr($item['file'], 0, 55));
        printf("║   Reason: %-53s ║\n", substr($item['reason'], 0, 53));
        echo "╟──────────────────────────────────────────────────────────────────╢\n";
    }
    echo "╚══════════════════════════════════════════════════════════════════╝\n";
}

// Print next steps
echo "\n";
echo "Next Steps:\n";
echo "1. Review the files marked for manual review\n";
echo "2. Run with --fix to apply changes\n";
echo "3. Run tests to verify functionality\n";
echo "4. Ensure all Policies are properly configured\n";
echo "\n";

// Exit with appropriate code
exit($stats['insecure'] > 0 && $dryRun ? 1 : 0);
