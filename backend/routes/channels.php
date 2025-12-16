<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Default Laravel user channel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Student notifications channel
Broadcast::channel('notifications.student.{id}', function ($user, $id) {
    Log::info('Channel auth attempt', [
        'channel' => 'notifications.student.' . $id,
        'user_class' => get_class($user),
        'user_id' => $user->id,
        'requested_id' => $id,
    ]);
    
    // Check if user class name ends with "Student" and IDs match
    $isStudent = str_ends_with(get_class($user), 'Student');
    $idsMatch = (string) $user->id === (string) $id;
    
    return $isStudent && $idsMatch;
});

// Teacher notifications channel
Broadcast::channel('notifications.teacher.{id}', function ($user, $id) {
    Log::info('Channel auth attempt', [
        'channel' => 'notifications.teacher.' . $id,
        'user_class' => get_class($user),
        'user_id' => $user->id,
        'requested_id' => $id,
    ]);
    
    // Check if user class name ends with "Teacher" and IDs match
    $isTeacher = str_ends_with(get_class($user), 'Teacher');
    $idsMatch = (string) $user->id === (string) $id;
    
    return $isTeacher && $idsMatch;
});

// Admin notifications channel
Broadcast::channel('notifications.admin.{id}', function ($user, $id) {
    Log::info('Channel auth attempt', [
        'channel' => 'notifications.admin.' . $id,
        'user_class' => get_class($user),
        'user_id' => $user->id,
        'requested_id' => $id,
    ]);
    
    // Check if user class name ends with "Admin" and IDs match
    $isAdmin = str_ends_with(get_class($user), 'Admin');
    $idsMatch = (string) $user->id === (string) $id;
    
    return $isAdmin && $idsMatch;
});

// Generic user channel (useful if you have polymorphic auth)
Broadcast::channel('notifications.user.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});
