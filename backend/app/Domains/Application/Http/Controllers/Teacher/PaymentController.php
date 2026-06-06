<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Subscriptions\DTOs\TeacherPaymentData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Payment\StorePaymentRequest;
use App\Domains\Application\Services\Teacher\PaymentService;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private PaymentService $service
    ) {}

    /**
     * تسجيل دفعة جديدة للطالب (المدرس المستقل)
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        try {
            $teacher = $this->getProfileFromRequest($request);
            $data = TeacherPaymentData::fromRequest($request);
            
            $result = $this->service->createPayment($teacher, $data);

            return $this->successResponse(
                $result,
                $result['is_duplicate'] ? 'الدفعة مسجلة مسبقاً' : 'تم تسجيل الدفعة بنجاح',
                $result['is_duplicate'] ? 200 : 201
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
