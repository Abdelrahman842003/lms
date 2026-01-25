<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\DTOs\Academy\PaymentData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Academy\StorePaymentRequest;
use App\Models\AcademyBilling;
use App\Models\Setting;
use App\Services\Academy\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $service
    ) {}

    /**
     * Store a new payment for a student (Academy/Secretary recording)
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        try {
            $data = PaymentData::fromRequest($request);
            $user = $request->user();
            
            $result = $this->service->createPayment($user, $data);

            return $this->successResponse(
                $result,
                $result['is_duplicate'] ? 'الدفعة مسجلة مسبقاً' : 'تم تسجيل الدفعة بنجاح',
                $result['is_duplicate'] ? 200 : 201
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * Initiate InstaPay payment for academy billing
     */
    /**
     * Initiate InstaPay payment for academy billing
     */
    public function initiateInstapayPayment(\App\Http\Requests\Academy\InitiateInstapayPaymentRequest $request): JsonResponse
    {
        try {
            $data = \App\DTOs\Academy\InstapayPaymentData::fromRequest($request);
            $user = $request->user();
            
            $result = $this->service->initiateInstapayPayment($user, $data);

            return $this->successResponse(
                $result,
                'تم إنشاء طلب الدفع بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}

