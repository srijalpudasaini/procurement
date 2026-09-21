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
        // 1. Add status to eoi_vendor_proposals
        Schema::table('eoi_vendor_proposals', function (Blueprint $table) {
            $table->enum('status', ['pending', 'awarded', 'rejected'])->default('pending')->after('price');
        });

        // 2. Add awarded_vendor_proposal_id to purchase_request_items
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->unsignedBigInteger('awarded_vendor_proposal_id')->nullable()->after('eoi_id');
            $table->foreign('awarded_vendor_proposal_id')
                ->references('id')
                ->on('eoi_vendor_proposals')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->dropForeign(['awarded_vendor_proposal_id']);
            $table->dropColumn('awarded_vendor_proposal_id');
        });

        Schema::table('eoi_vendor_proposals', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
