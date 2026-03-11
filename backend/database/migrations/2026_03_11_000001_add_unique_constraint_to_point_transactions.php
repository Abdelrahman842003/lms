<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Clean up any existing duplicates before adding the unique constraint
        $this->cleanupDuplicateTransactions();

        // Add unique index to prevent duplicate point transactions
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->unique(['student_id', 'teacher_id', 'type', 'reference_type', 'reference_id'], 'unique_point_transaction');
        });
    }

    public function down(): void
    {
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropUnique('unique_point_transaction');
        });
    }

    /**
     * حذف التكرارات الموجودة قبل إضافة الـ unique constraint
     * يحتفظ بالأقدم ويحذف الأحدث
     */
    private function cleanupDuplicateTransactions(): void
    {
        $duplicates = \Illuminate\Support\Facades\DB::select("
            SELECT student_id, teacher_id, type, reference_type, reference_id, COUNT(*) as count
            FROM point_transactions
            WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL
            GROUP BY student_id, teacher_id, type, reference_type, reference_id
            HAVING COUNT(*) > 1
        ");

        foreach ($duplicates as $duplicate) {
            // Find all duplicates for this combination
            $transactions = \App\Domains\Gamification\Models\PointTransaction::where('student_id', $duplicate->student_id)
                ->where('teacher_id', $duplicate->teacher_id)
                ->where('type', $duplicate->type)
                ->where('reference_type', $duplicate->reference_type)
                ->where('reference_id', $duplicate->reference_id)
                ->orderBy('created_at')
                ->get();

            // Keep the first one, delete the rest
            if ($transactions->count() > 1) {
                $transactions->skip(1)->each->delete();
            }
        }
    }
};
