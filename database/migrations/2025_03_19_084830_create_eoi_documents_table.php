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
        Schema::create('eoi_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eoi_id');
            $table->unsignedBigInteger('document_id');
            $table->boolean('required');
            $table->foreign('document_id')->references('id')->on('documents');
            $table->foreign('eoi_id')->references('id')->on('eois');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eoi_documents');
    }
};
