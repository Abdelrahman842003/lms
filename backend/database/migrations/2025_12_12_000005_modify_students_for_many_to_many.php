<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Helper function to check if foreign key exists
        $fkExists = function($table, $fkName) {
            $result = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
                AND TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ? 
                AND CONSTRAINT_NAME = ?
            ", [$table, $fkName]);
            return count($result) > 0;
        };

        // Helper function to check if index exists
        $indexExists = function($table, $indexName) {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return count($result) > 0;
        };

        // Get current column info
        $hasTeacherId = Schema::hasColumn('students', 'teacher_id');
        
        if ($hasTeacherId) {
            // Drop foreign keys using raw SQL if they exist
            if ($fkExists('students', 'students_teacher_id_foreign')) {
                DB::statement('ALTER TABLE students DROP FOREIGN KEY students_teacher_id_foreign');
            }
            if ($fkExists('students', 'students_grade_id_foreign')) {
                DB::statement('ALTER TABLE students DROP FOREIGN KEY students_grade_id_foreign');
            }
            if ($fkExists('students', 'students_group_id_foreign')) {
                DB::statement('ALTER TABLE students DROP FOREIGN KEY students_group_id_foreign');
            }

            // Drop unique index if exists
            if ($indexExists('students', 'students_teacher_id_username_unique')) {
                DB::statement('ALTER TABLE students DROP INDEX students_teacher_id_username_unique');
            }

            // Drop columns
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn(['teacher_id', 'grade_id', 'group_id', 'balance', 'is_active']);
            });
        }
        
        // Add new unique constraints if they don't exist
        if (!$indexExists('students', 'students_phone_unique')) {
            Schema::table('students', function (Blueprint $table) {
                $table->unique('phone');
            });
        }
        
        if (!$indexExists('students', 'students_username_unique')) {
            Schema::table('students', function (Blueprint $table) {
                $table->unique('username');
            });
        }
    }

    public function down(): void
    {
        // Remove new unique constraints if they exist
        $indexExists = function($table, $indexName) {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return count($result) > 0;
        };

        if ($indexExists('students', 'students_phone_unique')) {
            DB::statement('ALTER TABLE students DROP INDEX students_phone_unique');
        }
        if ($indexExists('students', 'students_username_unique')) {
            DB::statement('ALTER TABLE students DROP INDEX students_username_unique');
        }

        // Add back removed columns if they don't exist
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'teacher_id')) {
                $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            }
            if (!Schema::hasColumn('students', 'grade_id')) {
                $table->foreignUuid('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            }
            if (!Schema::hasColumn('students', 'group_id')) {
                $table->foreignUuid('group_id')->nullable()->constrained('groups')->onDelete('set null');
            }
            if (!Schema::hasColumn('students', 'balance')) {
                $table->decimal('balance', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('students', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });
    }
};
