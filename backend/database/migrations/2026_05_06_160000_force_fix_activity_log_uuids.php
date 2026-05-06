<?php

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
        $connection = config('activitylog.database_connection');
        $tableName = config('activitylog.table_name') ?? 'activity_log';

        Schema::connection($connection)->table($tableName, function (Blueprint $table) use ($tableName, $connection) {
            // Drop existing indexes if they exist to allow changing column types
            // The index names created by nullableMorphs are usually:
            // {table}_{index_name}_{index_type}_index
            
            // We'll use a try-catch or check if index exists to be safe
            $this->dropIndexIfExists($connection, $tableName, 'causer_causer_type_causer_id_index');
            $this->dropIndexIfExists($connection, $tableName, 'subject_subject_type_subject_id_index');

            // Now change the columns to char(36) for UUID support
            $table->char('causer_id', 36)->nullable()->change();
            $table->char('subject_id', 36)->nullable()->change();

            // Re-add the indexes
            $table->index(['causer_type', 'causer_id'], 'causer_causer_type_causer_id_index');
            $table->index(['subject_type', 'subject_id'], 'subject_subject_type_subject_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as char(36) is more general than bigint
    }

    /**
     * Helper to drop index safely
     */
    protected function dropIndexIfExists($connection, $table, $indexName): void
    {
        try {
            Schema::connection($connection)->table($table, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        } catch (\Exception $e) {
            // Index might not exist, ignore
        }
    }
};
