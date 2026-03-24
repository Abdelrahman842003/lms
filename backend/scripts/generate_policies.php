<?php

/**
 * Policy Generation Script
 * 
 * This script scans all models in the application and generates policy classes
 * for models that don't have an existing policy.
 * 
 * Usage: php backend/scripts/generate_policies.php
 * 
 * Options:
 *   --dry-run    Show what would be generated without creating files
 *   --force      Overwrite existing policies in App\Policies namespace
 *   --help       Show this help message
 */

// Configuration
$backendPath = dirname(__DIR__);
$appPath = $backendPath . '/app';

// Model directories to scan
$modelDirectories = [
    $appPath . '/Domains/*/Models',
    $appPath . '/Models',
];

// Policy directories to check for existing policies
$policyDirectories = [
    $appPath . '/Domains/*/Policies',
    $appPath . '/Policies',
];

// Parse command line arguments
$dryRun = in_array('--dry-run', $argv);
$force = in_array('--force', $argv);
$showHelp = in_array('--help', $argv);

if ($showHelp) {
    echo "Policy Generation Script\n";
    echo "========================\n\n";
    echo "This script generates Laravel Policy classes for models that don't have policies.\n\n";
    echo "Usage: php generate_policies.php [options]\n\n";
    echo "Options:\n";
    echo "  --dry-run    Show what would be generated without creating files\n";
    echo "  --force      Overwrite existing policies in App\\Policies namespace\n";
    echo "  --help       Show this help message\n";
    exit(0);
}

/**
 * Find all PHP files matching a glob pattern
 */
function findFiles(string $pattern): array
{
    $files = [];
    $directories = glob($pattern, GLOB_ONLYDIR);
    
    foreach ($directories as $dir) {
        $phpFiles = glob($dir . '/*.php');
        $files = array_merge($files, $phpFiles);
    }
    
    return $files;
}

/**
 * Extract the class name from a PHP file
 */
function extractClassName(string $filePath): ?string
{
    $content = file_get_contents($filePath);
    
    // Match namespace
    if (!preg_match('/namespace\s+([^;]+);/', $content, $namespaceMatch)) {
        return null;
    }
    
    // Match class name
    if (!preg_match('/class\s+(\w+)/', $content, $classMatch)) {
        return null;
    }
    
    return $namespaceMatch[1] . '\\' . $classMatch[1];
}

/**
 * Check if a file contains a Model class
 */
function isModelClass(string $filePath): bool
{
    $content = file_get_contents($filePath);
    
    // Check if it extends Model or Authenticatable
    return (bool) preg_match('/extends\s+(Authenticatable|Model|AuthenticatableContract)/', $content);
}

/**
 * Get the model name from full class name
 */
function getModelName(string $fullClassName): string
{
    $parts = explode('\\', $fullClassName);
    return end($parts);
}

/**
 * Convert model name to resource name (kebab-case plural)
 */
function getResourceName(string $modelName): string
{
    // Convert camelCase to kebab-case
    $kebab = strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $modelName));
    
    // Simple pluralization
    if (str_ends_with($kebab, 'y')) {
        $plural = substr($kebab, 0, -1) . 'ies';
    } elseif (str_ends_with($kebab, 's') || str_ends_with($kebab, 'x') || str_ends_with($kebab, 'ch') || str_ends_with($kebab, 'sh')) {
        $plural = $kebab . 'es';
    } else {
        $plural = $kebab . 's';
    }
    
    return $plural;
}

/**
 * Check if a policy already exists for a model
 */
function policyExists(string $modelName, array $existingPolicies): bool
{
    $policyName = $modelName . 'Policy';
    return in_array($policyName, $existingPolicies);
}

/**
 * Generate policy class content
 */
function generatePolicyContent(string $modelName, string $modelClass, string $resourceName): string
{
    $policyName = $modelName . 'Policy';
    
    return <<<PHP
<?php

declare(strict_types=1);

namespace App\Policies;

use {$modelClass};
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for {$modelName} model.
 *
 * Handles authorization for {$resourceName} operations.
 * 
 * @generated-by generate_policies.php
 * @review-needed This policy was auto-generated and should be reviewed for:
 *   - Custom ownership logic (ownsResource method)
 *   - Role-specific access patterns
 *   - Additional policy methods beyond CRUD
 */
class {$policyName} extends BasePolicy
{
    protected function getResourceName(): string
    {
        return '{$resourceName}';
    }

    // Add custom ownership logic if needed
    // protected function ownsResource(\$user, Model \$model): bool
    // {
    //     if (!\$model instanceof {$modelName}) {
    //         return false;
    //     }
    //     
    //     // Add ownership check logic here
    //     // Example: return \$model->user_id === \$user->id;
    //     
    //     return false;
    // }
}
PHP;
}

// Main execution
echo "Policy Generation Script\n";
echo "========================\n\n";

// Find all models
echo "Scanning for models...\n";
$models = [];

foreach ($modelDirectories as $dir) {
    $files = findFiles($dir);
    foreach ($files as $file) {
        if (isModelClass($file)) {
            $className = extractClassName($file);
            if ($className) {
                $models[getModelName($className)] = $className;
            }
        }
    }
}

echo "Found " . count($models) . " models.\n\n";

// Find existing policies
echo "Scanning for existing policies...\n";
$existingPolicies = [];

foreach ($policyDirectories as $dir) {
    $files = findFiles($dir);
    foreach ($files as $file) {
        $className = extractClassName($file);
        if ($className) {
            $parts = explode('\\', $className);
            $existingPolicies[] = end($parts);
        }
    }
}

echo "Found " . count($existingPolicies) . " existing policies.\n\n";

// Find models without policies
$modelsNeedingPolicies = [];

foreach ($models as $modelName => $modelClass) {
    if (!policyExists($modelName, $existingPolicies)) {
        $modelsNeedingPolicies[$modelName] = $modelClass;
    }
}

echo "Models needing policies: " . count($modelsNeedingPolicies) . "\n\n";

if (empty($modelsNeedingPolicies)) {
    echo "All models have policies. Nothing to generate.\n";
    exit(0);
}

// Generate policies
$policiesPath = $appPath . '/Policies';
$generated = [];
$skipped = [];

foreach ($modelsNeedingPolicies as $modelName => $modelClass) {
    $resourceName = getResourceName($modelName);
    $policyName = $modelName . 'Policy';
    $policyPath = $policiesPath . '/' . $policyName . '.php';
    
    if (!$force && file_exists($policyPath)) {
        $skipped[] = $modelName;
        echo "  Skipping {$policyName} (already exists)\n";
        continue;
    }
    
    $content = generatePolicyContent($modelName, $modelClass, $resourceName);
    
    if ($dryRun) {
        echo "  Would generate: {$policyPath}\n";
        $generated[] = $modelName;
    } else {
        if (!is_dir($policiesPath)) {
            mkdir($policiesPath, 0755, true);
        }
        
        file_put_contents($policyPath, $content);
        $generated[] = $modelName;
        echo "  Generated: {$policyName}\n";
    }
}

echo "\n";
echo "Summary\n";
echo "-------\n";
echo "Generated: " . count($generated) . " policies\n";
echo "Skipped: " . count($skipped) . " policies\n\n";

if ($dryRun) {
    echo "This was a dry run. No files were created.\n";
    echo "Run without --dry-run to create the files.\n";
}

// Output Artisan commands for manual registration
if (!empty($generated)) {
    echo "\n";
    echo "Artisan Commands for Manual Policy Registration\n";
    echo "-----------------------------------------------\n";
    echo "The following policies have been generated. Register them in AppServiceProvider:\n\n";
    
    foreach ($generated as $modelName) {
        echo "Gate::policy(\\App\\Models\\{$modelName}::class, \\App\\Policies\\{$modelName}Policy::class);\n";
    }
}

echo "\n";
echo "Next Steps\n";
echo "----------\n";
echo "1. Review generated policies for custom ownership logic\n";
echo "2. Add any additional policy methods beyond CRUD\n";
echo "3. Test authorization in your application\n";
echo "4. Register policies in AppServiceProvider if not using auto-discovery\n";
