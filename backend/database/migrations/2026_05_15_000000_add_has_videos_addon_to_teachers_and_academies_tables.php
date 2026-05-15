<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->boolean('has_videos_addon')->default(false)->after('paid_amount')->comment('Indicates if the teacher is subscribed to the online videos add-on');
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->boolean('has_videos_addon')->default(false)->after('paid_amount')->comment('Indicates if the academy is subscribed to the online videos add-on');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('has_videos_addon');
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->dropColumn('has_videos_addon');
        });
    }
};