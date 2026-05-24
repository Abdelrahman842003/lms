<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = ['students', 'enrollments', 'grades', 'groups', 'lectures', 'exams', 'notes'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    // Add index to updated_at for fast delta pulls
                    if (Schema::hasColumn($tableName, 'updated_at')) {
                        // Check if index already exists to avoid errors
                        $conn = Schema::getConnection();
                        $dbSchemaManager = $conn->getDoctrineSchemaManager();
                        $indexes = $dbSchemaManager->listTableIndexes($conn->getTablePrefix() . $tableName);
                        $indexName = $conn->getTablePrefix() . $tableName . '_updated_at_index';
                        
                        if (!array_key_exists($indexName, $indexes)) {
                            $table->index('updated_at');
                        }
                    }
                    
                    // Add version column for optimistic concurrency locking
                    if (!Schema::hasColumn($tableName, 'version')) {
                        $table->unsignedInteger('version')->default(1);
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['students', 'enrollments', 'grades', 'groups', 'lectures', 'exams', 'notes'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'updated_at')) {
                        try {
                            $table->dropIndex(['updated_at']);
                        } catch (\Exception $e) {
                            // Suppress if index doesn't exist
                        }
                    }
                    if (Schema::hasColumn($tableName, 'version')) {
                        $table->dropColumn('version');
                    }
                });
            }
        }
    }
};
