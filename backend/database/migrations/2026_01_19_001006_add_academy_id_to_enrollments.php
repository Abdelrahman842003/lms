<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add academy_id column to enrollments table
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignUuid('academy_id')
                  ->nullable()
                  ->after('grade_id')
                  ->constrained('academies')
                  ->onDelete('cascade');
            
            // Add index for better query performance
            $table->index('academy_id');
        });

        // Step 2: Migrate existing data from grades.academy_id to enrollments.academy_id
        DB::statement('
            UPDATE enrollments e
            INNER JOIN grades g ON e.grade_id = g.id
            SET e.academy_id = g.academy_id
            WHERE g.academy_id IS NOT NULL
        ');

        // Log migration results
        $total = DB::table('enrollments')->count();
        $withAcademy = DB::table('enrollments')->whereNotNull('academy_id')->count();
        $independent = $total - $withAcademy;
        
        \Log::info("Enrollment academy_id migration completed", [
            'total_enrollments' => $total,
            'with_academy' => $withAcademy,
            'independent' => $independent
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['academy_id']);
            $table->dropIndex(['academy_id']);
            $table->dropColumn('academy_id');
        });
    }
};
