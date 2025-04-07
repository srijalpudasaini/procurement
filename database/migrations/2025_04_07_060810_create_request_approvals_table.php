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
        Schema::create('request_approvals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_request_id');
            $table->unsignedBigInteger('approver_id')->nullable();
            $table->unsignedBigInteger('approval_step_id');
            $table->enum('status',['pending','approved','rejected'])->default('pending');
            $table->string('remark');
            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests');
            $table->foreign('approver_id')->references('id')->on('users');
            $table->foreign('approval_step_id')->references('id')->on('approval_steps');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_approvals');
    }
};
