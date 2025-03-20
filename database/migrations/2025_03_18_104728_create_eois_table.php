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
        Schema::create('eois', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_request_id');
            $table->string('title');
            $table->text('description');
            $table->integer('eoi_number');
            $table->date('published_date');
            $table->date('deadline_date');
            $table->enum('status',['published','closed'])->default('published');
            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eois');
    }
};
