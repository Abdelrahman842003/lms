<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\SubscriptionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Subscription\RecordPaymentRequest;
use App\Models\Academy;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Services\Admin\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    /**
     * List all subscriptions (aggregated teachers and academies)
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $page = (int) $request->input('page', 1);
        $filters = $request->only(['status', 'type', 'month', 'year', 'subscriber_id', 'subscriber_type', 'search']);
        $filters['page'] = $page;

        // Get aggregated data from teachers and academies
        $result = $this->subscriptionService->getAggregatedSubscriptions($perPage, $filters);

        return response()->json([
            'success' => true,
            'data' => $result['data'],
            'meta' => $result['meta'],
            'stats' => $result['stats'],
        ]);
    }

    /**
     * Get teacher subscription for a specific month
     */
    public function getTeacherSubscription(Request $request, string $teacherId): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $date = Carbon::parse($month . '-01');

        $subscription = $this->subscriptionService->getTeacherSubscription($teacherId, $date);
        $quotaUsage = $this->subscriptionService->getTeacherQuotaUsage($teacherId);

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => $subscription,
                'quota_usage' => $quotaUsage,
            ],
        ]);
    }

    /**
     * Get academy subscription for a specific month
     */
    public function getAcademySubscription(Request $request, string $academyId): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $date = Carbon::parse($month . '-01');

        $subscription = $this->subscriptionService->getAcademySubscription($academyId, $date);
        $quotaUsage = $this->subscriptionService->getAcademyQuotaUsage($academyId);

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => $subscription,
                'quota_usage' => $quotaUsage,
            ],
        ]);
    }

    /**
     * Record payment for a subscription
     */
    public function recordPayment(RecordPaymentRequest $request, string $subscriptionId): JsonResponse
    {
        $subscription = Subscription::findOrFail($subscriptionId);

        $subscription = $this->subscriptionService->recordPayment(
            $subscription,
            $request->input('amount'),
            $request->input('payment_method'),
            $request->input('notes')
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدفع بنجاح',
            'data' => $subscription,
        ]);
    }

    /**
     * Get subscription statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $type = $request->input('type');

        $typeEnum = $type ? SubscriptionType::from($type) : null;
        $statistics = $this->subscriptionService->getStatistics((int) $year, $typeEnum);

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    /**
     * Check if teacher can add more students
     */
    public function canTeacherAddStudent(string $teacherId): JsonResponse
    {
        $canAdd = $this->subscriptionService->canTeacherAddStudent($teacherId);
        $quotaUsage = $this->subscriptionService->getTeacherQuotaUsage($teacherId);

        return response()->json([
            'success' => true,
            'data' => [
                'can_add' => $canAdd,
                'quota_usage' => $quotaUsage,
            ],
        ]);
    }

    /**
     * Check if academy can add more enrollments
     */
    public function canAcademyAddEnrollment(string $academyId): JsonResponse
    {
        $canAdd = $this->subscriptionService->canAcademyAddEnrollment($academyId);
        $quotaUsage = $this->subscriptionService->getAcademyQuotaUsage($academyId);

        return response()->json([
            'success' => true,
            'data' => [
                'can_add' => $canAdd,
                'quota_usage' => $quotaUsage,
            ],
        ]);
    }

    /**
     * Get all subscriptions for a teacher
     */
    public function teacherSubscriptions(Request $request, string $teacherId): JsonResponse
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        $perPage = $request->input('per_page', 12);
        $subscriptions = $teacher->subscriptions()
            ->orderBy('month', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $subscriptions,
        ]);
    }

    /**
     * Get all subscriptions for an academy
     */
    public function academySubscriptions(Request $request, string $academyId): JsonResponse
    {
        $academy = Academy::findOrFail($academyId);
        
        $perPage = $request->input('per_page', 12);
        $subscriptions = $academy->subscriptions()
            ->orderBy('month', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $subscriptions,
        ]);
    }
}
