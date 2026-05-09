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
        Schema::table('teachers', function (Blueprint $table) {
            $table->unsignedSmallInteger('trial_period_days')->nullable();
            $table->string('plan_type')->nullable();
            $table->string('subscription_period')->nullable();
            $table->date('plan_expires_at')->nullable();
            $table->integer('plan_max_students')->nullable();
            $table->boolean('is_unlimited_students')->default(false);
            $table->decimal('subscription_fee', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->unsignedInteger('storage_limit_gb')->nullable();
            $table->unsignedBigInteger('storage_used_bytes')->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->string('discount_type', 20)->default('percent');
            $table->string('discount_scope', 20)->default('general');
            $table->text('billing_notes')->nullable();

            $table->index('plan_type');
            $table->index('plan_expires_at');
            $table->index('subscription_fee');
            $table->index('status'); // Good for reports
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->unsignedSmallInteger('trial_period_days')->nullable();
            $table->string('plan_type')->nullable();
            $table->string('subscription_period')->nullable();
            $table->date('plan_expires_at')->nullable();
            $table->integer('plan_max_students')->nullable();
            $table->boolean('is_unlimited_students')->default(false);
            $table->decimal('subscription_fee', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->unsignedInteger('storage_limit_gb')->nullable();
            $table->unsignedBigInteger('storage_used_bytes')->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->string('discount_type', 20)->default('percent');
            $table->string('discount_scope', 20)->default('general');
            $table->text('billing_notes')->nullable();

            $table->index('plan_type');
            $table->index('plan_expires_at');
            $table->index('subscription_fee');
            $table->index('is_active');
        });

        // Sync data from tenant_plans if any exists
        $this->syncData();
    }

    private function syncData(): void
    {
        $planFields = [
            'trial_period_days', 'plan_type', 'subscription_period', 'plan_expires_at',
            'plan_max_students', 'is_unlimited_students', 'subscription_fee',
            'paid_amount', 'storage_limit_gb', 'storage_used_bytes',
            'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
        ];

        \Illuminate\Support\Facades\DB::table('tenant_plans')->orderBy('created_at')->chunk(100, function ($plans) use ($planFields) {
            foreach ($plans as $plan) {
                $table = match ($plan->tenant_type) {
                    'App\Domains\Auth\Models\Teacher', 'teacher' => 'teachers',
                    'App\Domains\Auth\Models\Academy', 'academy' => 'academies',
                    default => null
                };

                if ($table) {
                    $updateData = [];
                    foreach ($planFields as $field) {
                        if (isset($plan->$field)) {
                            $updateData[$field] = $plan->$field;
                        }
                    }

                    if (!empty($updateData)) {
                        \Illuminate\Support\Facades\DB::table($table)
                            ->where('id', $plan->tenant_id)
                            ->update($updateData);
                    }
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn([
                'trial_period_days', 'plan_type', 'subscription_period', 'plan_expires_at',
                'plan_max_students', 'is_unlimited_students', 'subscription_fee',
                'paid_amount', 'storage_limit_gb', 'storage_used_bytes',
                'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
            ]);
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->dropColumn([
                'trial_period_days', 'plan_type', 'subscription_period', 'plan_expires_at',
                'plan_max_students', 'is_unlimited_students', 'subscription_fee',
                'paid_amount', 'storage_limit_gb', 'storage_used_bytes',
                'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
            ]);
        });
    }
};
