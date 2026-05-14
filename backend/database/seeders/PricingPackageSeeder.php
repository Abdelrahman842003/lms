<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Subscriptions\Models\PricingPackage;
use Illuminate\Database\Seeder;

class PricingPackageSeeder extends Seeder
{
    /**
     * Run the database seeds with Cloudflare Stream (Minutes) pricing.
     * Based on user request: 3 packages (500, 1500, 5000 EGP).
     */
    public function run(): void
    {
        $packages = [
            [
                'name_ar' => 'باقة المدرس المبتدئ',
                'name_en' => 'Starter Teacher',
                'max_students' => 100,
                'storage_minutes' => 500,
                'delivery_minutes' => 1000,
                'price' => 500,
                'yearly_price' => 5000, // 2 months discount
                'is_popular' => false,
                'sort_order' => 1,
                'features' => [
                    ['feature' => 'تخزين حتى 500 دقيقة فيديو'],
                    ['feature' => 'مشاهدة حتى 1000 دقيقة شهرياً'],
                    ['feature' => 'حتى 100 طالب نشط'],
                    ['feature' => 'دعم فني عبر البريد'],
                ],
            ],
            [
                'name_ar' => 'باقة المدرس المحترف',
                'name_en' => 'Professional Teacher',
                'max_students' => 500,
                'storage_minutes' => 2000,
                'delivery_minutes' => 5000,
                'price' => 1500,
                'yearly_price' => 15000,
                'is_popular' => true,
                'sort_order' => 2,
                'features' => [
                    ['feature' => 'تخزين حتى 2000 دقيقة فيديو'],
                    ['feature' => 'مشاهدة حتى 5000 دقيقة شهرياً'],
                    ['feature' => 'حتى 500 طالب نشط'],
                    ['feature' => 'دعم فني سريع (واتساب)'],
                    ['feature' => 'تقارير أداء متقدمة'],
                ],
            ],
            [
                'name_ar' => 'باقة المؤسسات',
                'name_en' => 'Enterprise Plan',
                'max_students' => 2000,
                'storage_minutes' => 10000,
                'delivery_minutes' => 20000,
                'price' => 5000,
                'yearly_price' => 50000,
                'is_popular' => false,
                'sort_order' => 3,
                'features' => [
                    ['feature' => 'تخزين حتى 10000 دقيقة فيديو'],
                    ['feature' => 'مشاهدة حتى 20000 دقيقة شهرياً'],
                    ['feature' => 'حتى 2000 طالب نشط'],
                    ['feature' => 'مدير حساب مخصص'],
                    ['feature' => 'تخصيص كامل للهوية'],
                ],
            ],
        ];

        foreach ($packages as $package) {
            PricingPackage::updateOrCreate(
                ['name_ar' => $package['name_ar']],
                $package
            );
        }
    }
}
