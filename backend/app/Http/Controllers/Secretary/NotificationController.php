<?php

declare(strict_types=1);

namespace App\Http\Controllers\Secretary;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponseTrait;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        $secretary = Auth::user();
        
        $notifications = $secretary->notifications()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse([
            'notifications' => $notifications
        ]);
    }

    public function markAsRead($id)
    {
        $secretary = Auth::user();
        $notification = $secretary->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->successResponse(null, 'Notification marked as read');
    }
}
