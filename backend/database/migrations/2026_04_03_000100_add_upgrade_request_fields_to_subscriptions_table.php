<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->string('request_type')->default('renewal')->after('status');

            $table->unsignedInteger('upgrade_seats_from')->nullable()->after('request_type');
            $table->unsignedInteger('upgrade_seats_to')->nullable()->after('upgrade_seats_from');
            $table->unsignedInteger('upgrade_storage_from_gb')->nullable()->after('upgrade_seats_to');
            $table->unsignedInteger('upgrade_storage_to_gb')->nullable()->after('upgrade_storage_from_gb');
            $table->decimal('upgrade_price_difference', 10, 2)->default(0)->after('upgrade_storage_to_gb');

            $table->timestamp('upgrade_reviewed_at')->nullable()->after('upgrade_price_difference');
            $table->uuid('upgrade_reviewed_by')->nullable()->after('upgrade_reviewed_at');
            $table->text('upgrade_rejection_reason')->nullable()->after('upgrade_reviewed_by');

            $table->index(['request_type', 'status'], 'subscriptions_request_type_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropIndex('subscriptions_request_type_status_idx');

            $table->dropColumn([
                'request_type',
                'upgrade_seats_from',
                'upgrade_seats_to',
                'upgrade_storage_from_gb',
                'upgrade_storage_to_gb',
                'upgrade_price_difference',
                'upgrade_reviewed_at',
                'upgrade_reviewed_by',
                'upgrade_rejection_reason',
            ]);
        });
    }
};
