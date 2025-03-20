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
        Schema::create('eoi_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eoi_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->foreign('eoi_id')->references('id')->on('eois');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eoi_files');
    }
};
