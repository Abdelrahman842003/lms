<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('avatar_key')->nullable()->after('password');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('avatar_key')->nullable()->after('password');
        });

        Schema::table('secretaries', function (Blueprint $table) {
            $table->string('avatar_key')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('avatar_key');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('avatar_key');
        });

        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropColumn('avatar_key');
        });
    }
};
