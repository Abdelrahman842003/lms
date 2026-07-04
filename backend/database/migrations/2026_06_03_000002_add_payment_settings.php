<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $settings = [
            [
                'key' => 'instapay_receiver_number',
                'value' => 'netaq@instapay',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'instapay_receiver_name',
                'value' => 'منصة نطاق التعليمية',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'vodafone_cash_receiver_number',
                'value' => '01012345678',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment_instructions_ar',
                'value' => "يرجى تحويل مبلغ الاشتراك الموضح أدناه إلى أحد الحسابات التالية:\n1. إنستاباي: netaq@instapay (الاسم: منصة نطاق التعليمية)\n2. فودافون كاش: 01012345678\n\nبعد إتمام التحويل، يرجى كتابة اسم المرسل ورقم الهاتف المحول منه ورفع صورة واضحة لإيصال التحويل لتأكيد الاشتراك خلال 48 ساعة.",
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment_expiry_hours',
                'value' => '48',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('settings')->insert($settings);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'instapay_receiver_number',
            'instapay_receiver_name',
            'vodafone_cash_receiver_number',
            'payment_instructions_ar',
            'payment_expiry_hours',
        ])->delete();
    }
};
