<?php

declare(strict_types=1);

namespace App\Domains\Support\Traits;

use App\Domains\Auth\Models\DeviceToken;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasDeviceTokens
{
    /**
     * Get the device tokens for the user.
     */
    public function deviceTokens(): MorphMany
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
