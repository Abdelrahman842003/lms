<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers;

use App\Domains\Application\Traits\ApiResponseTrait;

abstract class Controller
{
    use ApiResponseTrait;
}
