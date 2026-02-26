<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers;

use App\Domains\Support\Traits\ApiResponseTrait;

abstract class Controller
{
    use ApiResponseTrait;
}
