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
        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->id(); // bigint unsigned auto_increment primary key
            $table->uuid('uuid')->unique();
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->foreignUuid('academy_id')->nullable()->constrained('academies')->onDelete('cascade');
            $table->enum('type', ['independent', 'academy'])->default('independent');
            $table->string('display_name');
            $table->string('slug')->unique();
            $table->string('status')->default('ACTIVE'); // ACTIVE, INACTIVE, SUSPENDED
            $table->timestamps();

            // Unique constraint: A teacher can only have one profile per academy
            $table->unique(['teacher_id', 'academy_id']);

            // Virtual column + unique index to enforce exactly one independent profile per teacher
            $table->tinyInteger('independent_sentinel')
                ->virtualAs('(IF(academy_id IS NULL, 1, NULL))');
            
            $table->unique(['teacher_id', 'independent_sentinel'], 'teacher_independent_profile_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_profiles');
    }
};
