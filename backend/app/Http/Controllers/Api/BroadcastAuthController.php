<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        
        Log::info('Broadcasting auth attempt', [
            'user' => $user ? get_class($user) . ':' . $user->id : 'null',
            'channel' => $request->input('channel_name'),
            'socket_id' => $request->input('socket_id'),
        ]);
        
        if (!$user) {
            Log::warning('Broadcasting auth failed: no user');
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Use Laravel's built-in broadcast auth
        return Broadcast::auth($request);
    }
}
