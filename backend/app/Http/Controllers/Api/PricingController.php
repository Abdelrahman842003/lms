<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domains\Subscriptions\Models\PricingPackage;
use App\Domains\Application\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PricingController extends Controller
{
    /**
     * Get all active pricing packages.
     */
    public function index(): JsonResponse
    {
        $packages = PricingPackage::active()->get();

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'Success',
            'data' => $packages,
        ]);
    }
}
