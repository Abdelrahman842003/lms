<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Subscriptions\DTOs\PaymentData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\StorePaymentRequest;
use App\Domains\Application\Services\Academy\PaymentService;
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


}

