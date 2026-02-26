<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

class BroadcastAuthController extends Controller
{
    /**
     * Authenticate the request for channel access.
     */
    public function authenticate(Request $request)
    {
        $user = $request->user();
        
        Log::debug('Broadcasting auth attempt', [
            'user' => $user ? get_class($user) . ':' . $user->id : 'null',
            'channel' => $request->input('channel_name'),
        ]);
        
        if (!$user) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return Broadcast::auth($request);
    }
}
