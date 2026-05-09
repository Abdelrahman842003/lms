<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Subscriptions\Models\PricingPackage;
use Illuminate\Database\Seeder;

class PricingPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            [
                'name_ar' => 'الباقة المجانية',
                'name_en' => 'Free Plan',
                'max_students' => 30,
                'storage_limit_gb' => 1,
                'price' => 0,
                'yearly_price' => 0,
                'is_popular' => false,
                'sort_order' => 1,
                'features' => [
                    ['feature' => 'إضافة الطلاب وسكرتارية وأولياء أمور'],
                    ['feature' => 'الامتحانات بنوعيها (ذاتي وتلقائي)'],
                    ['feature' => 'رفع الفيديوهات التعليمية'],
                    ['feature' => 'نظام الألعاب والتحفيز (Gamification)'],
                    ['feature' => 'التقارير التفصيلية والدردشة'],
                ],
            ],
            [
                'name_ar' => 'الباقة الأساسية',
                'name_en' => 'Basic Plan',
                'max_students' => 500,
                'storage_limit_gb' => 2,
                'price' => 2500,
                'discount_percentage' => 0,
                'yearly_price' => 30000,
                'yearly_discount_percentage' => 15,
                'is_popular' => true,
                'sort_order' => 2,
                'features' => [
                    ['feature' => 'تشمل كل مميزات الباقة المجانية'],
                    ['feature' => 'سعة حتى 500 طالب'],
                    ['feature' => 'مساحة تخزين 2 جيجابايت'],
                    ['feature' => 'دعم فني سريع'],
                ],
            ],
            [
                'name_ar' => 'الباقة الفضية',
                'name_en' => 'Silver Plan',
                'max_students' => 1000,
                'storage_limit_gb' => 5,
                'price' => 4500,
                'discount_percentage' => 10,
                'yearly_price' => 54000,
                'yearly_discount_percentage' => 20,
                'is_popular' => false,
                'sort_order' => 3,
                'features' => [
                    ['feature' => 'تشمل كل مميزات الباقة الأساسية'],
                    ['feature' => 'سعة حتى 1000 طالب'],
                    ['feature' => 'مساحة تخزين 5 جيجابايت'],
                    ['feature' => 'تقارير أداء متقدمة'],
                ],
            ],
            [
                'name_ar' => 'الباقة الذهبية',
                'name_en' => 'Gold Plan',
                'max_students' => 3000,
                'storage_limit_gb' => 20,
                'price' => 10000,
                'discount_percentage' => 15,
                'yearly_price' => 120000,
                'yearly_discount_percentage' => 25,
                'is_popular' => false,
                'sort_order' => 4,
                'features' => [
                    ['feature' => 'تشمل كل مميزات الباقة الفضية'],
                    ['feature' => 'سعة حتى 3000 طالب'],
                    ['feature' => 'مساحة تخزين 20 جيجابايت'],
                    ['feature' => 'إدارة فروع متعددة (Multi-Academy)'],
                ],
            ],
            [
                'name_ar' => 'الباقة الماسية',
                'name_en' => 'Diamond Plan',
                'max_students' => 0, // Unlimited
                'storage_limit_gb' => 100,
                'price' => 25000,
                'discount_percentage' => 20,
                'yearly_price' => 300000,
                'yearly_discount_percentage' => 30,
                'is_popular' => false,
                'sort_order' => 5,
                'features' => [
                    ['feature' => 'تشمل كل مميزات الباقة الذهبية'],
                    ['feature' => 'عدد طلاب غير محدود'],
                    ['feature' => 'مساحة تخزين 100 جيجابايت'],
                    ['feature' => 'مدير حساب مخصص (Account Manager)'],
                    ['feature' => 'تخصيص كامل للهوية (White Label)'],
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
