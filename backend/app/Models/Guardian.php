<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Guardian extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'phone',
        'name',
        'password',
        'avatar_key',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'id' => 'string',
    ];

    /**
     * Get all students for this guardian
     */
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    /**
     * Legacy support: Get students by parent_phone
     */
    public function studentsByPhone()
    {
        return Student::where('parent_phone', $this->phone)->get();
    }
    /**
     * Get the device tokens for the guardian.
     */
    public function deviceTokens()
    {
        return $this->morphMany(DeviceToken::class, 'tokenable');
    }

    /**
     * Route notifications for the FCM channel.
     *
     * @return array
     */
    public function routeNotificationForFcm()
    {
        return $this->deviceTokens()->pluck('token')->toArray();
    }
}
