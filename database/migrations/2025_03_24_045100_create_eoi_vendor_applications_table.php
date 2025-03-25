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
        Schema::create('eoi_vendor_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('vendor_id');
            $table->unsignedBigInteger('eoi_id');
            $table->enum('status',['approved','rejected','pending'])->default('pending');
            $table->date('application_date');
            $table->foreign('vendor_id')->references('id')->on('vendors');
            $table->foreign('eoi_id')->references('id')->on('eois');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eoi_vendor_applications');
    }
};
