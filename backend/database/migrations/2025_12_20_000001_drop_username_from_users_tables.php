<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop username column and index from teachers table
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropIndex(['username']);
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });

        // Drop username column and index from students table
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });

        // Drop username column and index from secretaries table
        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropIndex(['username']);
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }

    public function down(): void
    {
        // Restore username column to teachers table
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');
            $table->index('username');
        });

        // Restore username column to students table
        Schema::table('students', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');
        });

        // Restore username column to secretaries table
        Schema::table('secretaries', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');
            $table->index('username');
        });
    }
};
