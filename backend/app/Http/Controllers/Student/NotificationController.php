<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponseTrait;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        $student = Auth::user();
        
        $notifications = $student->notifications()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse([
            'notifications' => $notifications
        ]);
    }

    public function markAsRead($id)
    {
        $student = Auth::user();
        $notification = $student->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->successResponse(null, 'Notification marked as read');
    }
}
