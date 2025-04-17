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
        Schema::table('request_approvals', function (Blueprint $table) {
            if (Schema::hasColumn('request_approvals', 'purchase_request_id')) {
                $table->dropForeign(['purchase_request_id']);
                $table->dropColumn('purchase_request_id');
            }

            // Add polymorphic fields
            $table->string('approvable_type')->after('id');
            $table->unsignedBigInteger('approvable_id')->after('approvable_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_approvals', function (Blueprint $table) {
            //
        });
    }
};
