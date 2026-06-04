<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->decimal('price', 8, 2)->default(0);
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            $table->uuid('academy_id')->nullable(); // Will add foreign key later
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            
            $table->index('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
