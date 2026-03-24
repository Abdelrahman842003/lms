<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Domains\Application\Models\Setting;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip for admin routes and login
        if ($request->is('api/admin/*') || $request->is('admin/*') || $request->is('api/login/*') || $request->is('api/public-settings')) {
            return $next($request);
        }

        try {
            $maintenanceMode = Setting::where('key', 'maintenanceMode')->value('value');

            if ($maintenanceMode === 'true') {
                return response()->json([
                    'message' => 'System is currently in maintenance mode.',
                    'maintenance' => true
                ], 503);
            }
        } catch (\Exception $e) {
            // If DB fails, proceed (or handle gracefully)
            // Log::error($e->getMessage());
        }

        return $next($request);
    }
}
