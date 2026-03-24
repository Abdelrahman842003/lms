<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use App\Domains\Subscriptions\Specifications\PlanActive;
use App\Domains\Subscriptions\Specifications\SeatAvailable;
use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Application\Exceptions\SeatLimitException;
use App\Domains\Application\Exceptions\SubscriptionExpiredException;
use Illuminate\Support\Facades\DB;

/**
 * Action لإنشاء تسجيل جديد (Enrollment).
 *
 * يتحقق بالترتيب:
 *  1. لا يوجد تسجيل نشط مسبقاً لنفس (student, teacher)
 *  2. الباقة نشطة (PlanActive specification)
 *  3. يوجد مقاعد متاحة (SeatAvailable specification)
 *  4. ينشئ الـ enrollment داخل transaction
 */
final class CreateEnrollmentAction
{
    public function __construct(
        private readonly EnrollmentRepository $enrollments,
        private readonly SeatAvailable        $seatAvailable,
        private readonly PlanActive           $planActive,
    ) {}

    /**
     * @throws DomainException
     * @throws SeatLimitException
     * @throws SubscriptionExpiredException
     */
    public function execute(CreateEnrollmentDTO $dto): Enrollment
    {
        return DB::transaction(function () use ($dto) {

            // 1. منع التسجيل المكرر
            $existing = $this->enrollments->findActiveByStudentTeacher(
                $dto->studentId,
                $dto->teacherId,
                $dto->organizationId
            );

            if ($existing !== null) {
                throw new DomainException('الطالب مشترك بالفعل مع هذا المدرس.');
            }

            // 2. تحديد نوع المشترك
            $subscriberType = $dto->organizationId ? 'academy' : 'teacher';
            $subscriberId   = $dto->organizationId ?? $dto->teacherId;

            // 3. التحقق من نشاط الباقة
            if (! $this->planActive->isSatisfiedBy($subscriberId, $subscriberType)) {
                throw new SubscriptionExpiredException('انتهت صلاحية الاشتراك. يرجى تجديد الباقة.');
            }

            // 4. الحصول على الاشتراك مع lockForUpdate لمنع Race Condition
            $subscription = $this->getSubscriptionWithLock($subscriberId, $subscriberType);

            if (! $subscription) {
                throw new SubscriptionExpiredException('الاشتراك غير نشط.');
            }

            // 5. زيادة عداد المقاعد بشكل atomي (يفحص ويزيد في عملية واحدة)
            $updated = DB::table($subscription->getTable())
                ->where('id', $subscription->id)
                ->where('status', 'active')
                ->whereColumn('used_seats', '<', 'max_seats')
                ->update(['used_seats' => DB::raw('used_seats + 1')]);

            if ($updated === 0) {
                throw new SeatLimitException('لا تتوفر مقاعد شاغرة. يرجى ترقية الباقة.');
            }

            // 6. إنشاء الـ enrollment
            $enrollment = $this->enrollments->create($dto);

            // 7. refresh للحصول على القيمة الجديدة
            $subscription->refresh();

            return $enrollment;
        });
    }

    /**
     * Get subscription with pessimistic lock to prevent race conditions.
     */
    private function getSubscriptionWithLock(int $subscriberId, string $subscriberType): ?object
    {
        if ($subscriberType === 'teacher') {
            return \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $subscriberId)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();
        }

        return \App\Domains\Auth\Models\AcademySubscription::where('academy_id', $subscriberId)
            ->where('status', 'active')
            ->lockForUpdate()
            ->first();
    }
}
