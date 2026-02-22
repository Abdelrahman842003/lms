<?php

namespace App\Console\Commands;

use App\Models\Academy;
use App\Models\Teacher;
use App\Services\Infrastructure\HelperService;
use Illuminate\Console\Command;

class RecalculateSubscriptionFees extends Command
{
    protected $signature = 'subscriptions:recalculate-fees';
    protected $description = 'Recalculate subscription fees for all academies and teachers';

    public function handle(): int
    {
        $teacherPrice = HelperService::getPricePerStudent() ?: 60;
        $academyPrice = HelperService::getAcademyStudentPrice() ?: 40;

        $this->info("Using Teacher Price: {$teacherPrice} EGP");
        $this->info("Using Academy Price: {$academyPrice} EGP");
        $this->newLine();

        // Recalculate Teachers
        $this->info('Processing Teachers...');
        $teachers = Teacher::whereNotNull('plan_type')
            ->where('plan_type', '!=', 'none')
            ->where('plan_type', '!=', '')
            ->where('plan_type', '!=', 'trial') // Skip trial plans
            ->get();

        foreach ($teachers as $teacher) {
            $oldFee = $teacher->subscription_fee;
            
            // Calculate duration in months
            $planStartsAt = $teacher->plan_starts_at ?? $teacher->created_at ?? now();
            $planExpiresAt = $teacher->plan_expires_at;
            
            if (!$planExpiresAt) {
                $this->warn("Teacher {$teacher->name}: No expiry date, skipping");
                continue;
            }
            
            $durationMonths = max(1, ceil($planStartsAt->diffInDays($planExpiresAt) / 30));
            $maxStudents = $teacher->plan_max_students ?? 0;
            
            // Skip unlimited plans or zero students
            if ($teacher->is_unlimited_students || $maxStudents <= 0) {
                $this->warn("Teacher {$teacher->name}: Unlimited or zero students, skipping");
                continue;
            }
            
            // Calculate new fee
            $newFee = $maxStudents * $durationMonths * $teacherPrice;
            
            $teacher->subscription_fee = $newFee;
            $teacher->save();
            
            $this->info("Teacher {$teacher->name}: {$oldFee} → {$newFee} EGP ({$maxStudents} students × {$durationMonths} months × {$teacherPrice} EGP)");
        }

        $this->newLine();

        // Recalculate Academies
        $this->info('Processing Academies...');
        $academies = Academy::whereNotNull('plan_type')
            ->where('plan_type', '!=', 'none')
            ->where('plan_type', '!=', '')
            ->where('plan_type', '!=', 'trial') // Skip trial plans
            ->get();

        foreach ($academies as $academy) {
            $oldFee = $academy->subscription_fee;
            
            // Calculate duration in months
            $planStartsAt = $academy->plan_starts_at ?? $academy->created_at ?? now();
            $planExpiresAt = $academy->plan_expires_at;
            
            if (!$planExpiresAt) {
                $this->warn("Academy {$academy->name}: No expiry date, skipping");
                continue;
            }
            
            $durationMonths = max(1, ceil($planStartsAt->diffInDays($planExpiresAt) / 30));
            $maxStudents = $academy->plan_max_students ?? 0;
            
            // Skip unlimited plans or zero students
            if ($academy->is_unlimited_students || $maxStudents <= 0) {
                $this->warn("Academy {$academy->name}: Unlimited or zero students, skipping");
                continue;
            }
            
            // Calculate new fee
            $newFee = $maxStudents * $durationMonths * $academyPrice;
            
            $academy->subscription_fee = $newFee;
            $academy->save();
            
            $this->info("Academy {$academy->name}: {$oldFee} → {$newFee} EGP ({$maxStudents} students × {$durationMonths} months × {$academyPrice} EGP)");
        }

        $this->newLine();
        $this->info('Done! All subscription fees have been recalculated.');

        return self::SUCCESS;
    }
}
