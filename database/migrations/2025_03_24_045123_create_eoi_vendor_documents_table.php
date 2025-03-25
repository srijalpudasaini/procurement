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
        Schema::create('eoi_vendor_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eoi_vendor_application_id');
            $table->unsignedBigInteger('document_id');
            $table->string('name');column: 
            $table->foreign('eoi_vendor_application_id')->references('id')->on('eoi_vendor_applications');
            $table->foreign('document_id')->references('id')->on('documents');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eoi_vendor_documents');
    }
};
