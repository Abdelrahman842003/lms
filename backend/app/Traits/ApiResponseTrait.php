<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Success Response
     *
     * @param mixed $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function successResponse($data = null, $message = 'Success', $code = 200): JsonResponse
    {
        return response()->json([
            'status' => true,
            'status_code' => $code,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Error Response
     *
     * @param string $message
     * @param int $code
     * @param mixed $errors
     * @return JsonResponse
     */
    protected function errorResponse($message = 'Error', $code = 400, $errors = null): JsonResponse
    {
        return response()->json([
            'status' => false,
            'status_code' => $code,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
