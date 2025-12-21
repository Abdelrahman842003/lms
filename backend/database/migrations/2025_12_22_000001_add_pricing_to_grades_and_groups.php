<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->decimal('price', 8, 2)->default(0)->after('name');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->enum('type', ['general', 'private'])->default('general')->after('teacher_id');
            $table->decimal('price', 8, 2)->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn('price');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['type', 'price']);
        });
    }
};
